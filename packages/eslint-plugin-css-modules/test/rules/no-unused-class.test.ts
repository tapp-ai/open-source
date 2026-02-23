import path from "node:path";
import { RuleTester } from "eslint";
import rule from "../../src/rules/no-unused-class.ts";

const fixtureDir = path.resolve(import.meta.dirname, "../files");

function addFilename<T extends object>(testCase: T): T & { filename: string } {
  return { ...testCase, filename: path.join(fixtureDir, "foo.js") };
}

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
    parserOptions: {
      ecmaFeatures: { jsx: true },
    },
  },
});

ruleTester.run("no-unused-class", rule, {
  valid: [
    {
      name: "absolute import eg: 'foo/bar.scss'",
      code: `
        import s from 'test/files/noUndefClass1.scss';

        export default Foo = () => (
          <div className={s.container}></div>
        );
      `,
    },
    {
      name: "dot notation and square brackets",
      code: `
        import s from './noUnusedClass1.scss';

        export default Foo = () => (
          <div className={s.foo}>
            <div className={s['bar']}>
              <span className={s.bold}></span>
            </div>
          </div>
        );
      `,
    },
    {
      name: "ignore global scope selector",
      code: `
        import s from './noUnusedClass2.scss';

        export default Foo = () => (
          <div className={s.foo}>
            <span className="bar"></span>
          </div>
        );
      `,
    },
    {
      name: "ignore props exported by ICSS :export pseudo-selector",
      code: `
        import s from './export1.scss';

        export default Foo = () => (
          <div className={s.bar}></div>
        );
      `,
    },
    {
      name: "check if composes classes are ignored",
      code: `
        import s from './composes1.scss';

        export default Foo = () => (
          <div className={s.bar}>
            <span className={s.baz}></span>
          </div>
        );
      `,
    },
    {
      name: "composes with multiple classes",
      code: `
        import s from './composesMultiple1.scss';

        export default Foo = () => (
          <div className={s.bar}>
            <span className={s.baz}></span>
          </div>
        );
      `,
    },
    {
      name: "check if @extend classes are ignored",
      code: `
        import s from './extend1.scss';

        export default Foo = () => (
          <div className={s.bar}>
            <span className={s.baz}></span>
          </div>
        );
      `,
    },
    {
      name: "check if classes are ignored if they only exist for nesting parent selectors",
      code: `
        import s from './parentSelector7.scss';

        export default Foo = () => (
          <div>
            <span className={s.foo_bar}></span>
            <span className={s.foo_baz}></span>
          </div>
        );
      `,
    },
    {
      name: "camelCase=true classes work as expected",
      code: `
        import s from './noUnusedClass3.scss';

        export default Foo = () => (
          <div className={s.fooBar}>
            <div className={s.barFoo}></div>
            <div className={s.alreadyCamelCased}></div>
            <div className={s.snakeCased}></div>
          </div>
        );
      `,
      options: [{ camelCase: true }],
    },
    {
      name: "camelCase=true with original names",
      code: `
        import s from './noUnusedClass3.scss';

        export default Foo = () => (
          <div className={s['foo-bar']}>
            <div className={s['bar-foo']}></div>
            <div className={s.alreadyCamelCased}></div>
            <div className={s.snake_cased}></div>
          </div>
        );
      `,
      options: [{ camelCase: true }],
    },
    {
      name: "camelCase=dashes classes work as expected",
      code: `
        import s from './noUnusedClass3.scss';

        export default Foo = () => (
          <div className={s.fooBar}>
            <div className={s.barFoo}></div>
            <div className={s.alreadyCamelCased}></div>
            <div className={s.snake_cased}></div>
          </div>
        );
      `,
      options: [{ camelCase: "dashes" }],
    },
    {
      name: "camelCase=dashes with original names",
      code: `
        import s from './noUnusedClass3.scss';

        export default Foo = () => (
          <div className={s['foo-bar']}>
            <div className={s['bar-foo']}></div>
            <div className={s.alreadyCamelCased}></div>
            <div className={s.snake_cased}></div>
          </div>
        );
      `,
      options: [{ camelCase: "dashes" }],
    },
    {
      name: "camelCase=only classes work as expected",
      code: `
        import s from './noUnusedClass3.scss';

        export default Foo = () => (
          <div className={s.fooBar}>
            <div className={s.barFoo}></div>
            <div className={s.alreadyCamelCased}></div>
            <div className={s.snakeCased}></div>
          </div>
        );
      `,
      options: [{ camelCase: "only" }],
    },
    {
      name: "camelCase=dashes-only classes work as expected",
      code: `
        import s from './noUnusedClass3.scss';

        export default Foo = () => (
          <div className={s.fooBar}>
            <div className={s.barFoo}></div>
            <div className={s.alreadyCamelCased}></div>
            <div className={s.snake_cased}></div>
          </div>
        );
      `,
      options: [{ camelCase: "dashes-only" }],
    },
  ].map(addFilename),

  invalid: [
    {
      name: "unused class error",
      code: `
        import s from './noUnusedClass1.scss';

        export default Foo = () => (
          <div className={s.bar}></div>
        );
      `,
      errors: [
        { message: "Unused classes found in noUnusedClass1.scss: foo, bold" },
      ],
    },
    {
      name: "ignored global scope selector class",
      code: `
        import s from './noUnusedClass2.scss';

        export default Foo = () => (
          <div></div>
        );
      `,
      errors: [
        { message: "Unused classes found in noUnusedClass2.scss: foo" },
      ],
    },
    {
      name: "check less support",
      code: `
        import s from './noUnusedClass1.less';

        export default Foo = () => (
          <div></div>
        );
      `,
      errors: [
        { message: "Unused classes found in noUnusedClass1.less: foo" },
      ],
    },
    {
      name: "check composes support",
      code: `
        import s from './composes1.scss';

        export default Foo = () => (
          <div className={s.bar}></div>
        );
      `,
      errors: [
        { message: "Unused classes found in composes1.scss: baz" },
      ],
    },
    {
      name: "check multiple composes support",
      code: `
        import s from './composesMultiple1.scss';

        export default Foo = () => (
          <div className={s.bar}></div>
        );
      `,
      errors: [
        { message: "Unused classes found in composesMultiple1.scss: baz" },
      ],
    },
    {
      name: "check @extend support",
      code: `
        import s from './extend1.scss';

        export default Foo = () => (
          <div className={s.bar}></div>
        );
      `,
      errors: [
        { message: "Unused classes found in extend1.scss: baz" },
      ],
    },
    {
      name: "using parent selector",
      code: `
        import s from './parentSelector4.scss';

        export default Foo = () => (
          <div className={s.foo}>
            <div className={s.foo_baz}></div>
          </div>
        );
      `,
      errors: [
        { message: "Unused classes found in parentSelector4.scss: foo_bar" },
      ],
    },
    {
      name: "snake_case parent selector",
      code: `
        import s from './parentSelector8.scss';

        export default Foo = () => (
          <div className={s.foo} />
        );
      `,
      errors: [
        { message: "Unused classes found in parentSelector8.scss: foo_bar" },
      ],
    },
    {
      name: "camelCase=true unused detection",
      code: `
        import s from './noUnusedClass3.scss';

        export default Foo = () => (
          <div className={ s.fooBar } />
        );
      `,
      options: [{ camelCase: true }],
      errors: [
        {
          message:
            "Unused classes found in noUnusedClass3.scss: bar-foo, alreadyCamelCased, snake_cased",
        },
      ],
    },
    {
      name: "camelCase=dashes unused detection",
      code: `
        import s from './noUnusedClass3.scss';

        export default Foo = () => (
          <div className={ s.fooBar }>
            <div className={s.snakeCased}></div>
          </div>
        );
      `,
      options: [{ camelCase: "dashes" }],
      errors: [
        {
          message:
            "Unused classes found in noUnusedClass3.scss: bar-foo, alreadyCamelCased, snake_cased",
        },
      ],
    },
    {
      name: "camelCase=only unused detection",
      code: `
        import s from './noUnusedClass3.scss';

        export default Foo = () => (
          <div className={s['foo-bar']}>
            <div className={s.barFoo}></div>
            <div className={s.snakeCased}></div>
            <div className={s.bar}></div>
          </div>
        );
      `,
      options: [{ camelCase: "only" }],
      errors: [
        {
          message:
            "Unused classes found in noUnusedClass3.scss: foo-bar, alreadyCamelCased",
        },
      ],
    },
    {
      name: "camelCase=dashes-only unused detection",
      code: `
        import s from './noUnusedClass3.scss';

        export default Foo = () => (
          <div className={s['foo-bar']}>
            <div className={s.barFoo}></div>
            <div className={s.snakeCased}></div>
            <div className={s.bar}></div>
          </div>
        );
      `,
      options: [{ camelCase: "dashes-only" }],
      errors: [
        {
          message:
            "Unused classes found in noUnusedClass3.scss: foo-bar, alreadyCamelCased, snake_cased",
        },
      ],
    },
  ].map(addFilename),
});
