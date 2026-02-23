import path from "node:path";
import { RuleTester } from "eslint";
import rule from "../../src/rules/no-undef-class.ts";

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

ruleTester.run("no-undef-class", rule, {
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
      name: "dot notation",
      code: `
        import s from './noUndefClass1.scss';

        export default Foo = () => (
          <div className={s.container}></div>
        );
      `,
    },
    {
      name: "square bracket string key",
      code: `
        import s from './noUndefClass1.scss';

        export default Foo = () => (
          <div className={s['container']}></div>
        );
      `,
    },
    {
      name: "does not check for dynamic properties",
      code: `
        import s from './noUndefClass1.scss';

        export default Foo = (props) => (
          <div className={s[props.primary]}></div>
        );
      `,
    },
    {
      name: "names starting with _ will be ignored",
      code: `
        import s from './noUndefClass1.scss';

        export default Foo = () => (
          <div>
            {s._getCss()}
          </div>
        );
      `,
    },
    {
      name: "using composes",
      code: `
        import s from './composes1.scss';

        export default Foo = () => (
          <div className={s.bar}>
            <div className={s.baz}></div>
          </div>
        );
      `,
    },
    {
      name: "composing with multiple classes",
      code: `
        import s from './composesMultiple1.scss';

        export default Foo = () => (
          <div className={s.bar}>
            <div className={s.baz}></div>
          </div>
        );
      `,
    },
    {
      name: "using @extend",
      code: `
        import s from './extend1.scss';

        export default Foo = () => (
          <div className={s.bar}>
            <div className={s.baz}></div>
          </div>
        );
      `,
    },
    {
      name: "using parent selector (&)",
      code: `
        import s from './parentSelector1.scss';

        export default Foo = () => (
          <div className={s.foo}>
            <div className={s.foo_bar}></div>
          </div>
        );
      `,
    },
    {
      name: "parent selector nested classes",
      code: `
        import s from './parentSelector2.scss';

        export default Foo = () => (
          <div className={s.foo}>
            <div className={s.bar}></div>
            <div className={s.bar_baz}></div>
          </div>
        );
      `,
    },
    {
      name: "parent selector multiple extensions",
      code: `
        import s from './parentSelector3.scss';

        export default Foo = () => (
          <div className={s.foo}>
            <div className={s.foo_bar}></div>
            <div className={s.foo_baz}></div>
          </div>
        );
      `,
    },
    {
      name: "parent selector with comma-separated selectors",
      code: `
        import s from './parentSelector4.scss';

        export default Foo = () => (
          <div className={s.foo}>
            <div className={s.foo_bar}></div>
            <div className={s.foo_baz}></div>
          </div>
        );
      `,
    },
    {
      name: "parent selector with multiple base classes",
      code: `
        import s from './parentSelector5.scss';

        export default Foo = () => (
          <div className={s.foo}>
            <div className={s.foo_baz}></div>
            <div className={s.bar_baz}></div>
          </div>
        );
      `,
    },
    {
      name: "deeply nested parent selector",
      code: `
        import s from './parentSelector6.scss';

        export default Foo = () => (
          <div className={s.foo}>
            <div className={s.foo_bar}></div>
            <div className={s.foo_bar_baz}></div>
          </div>
        );
      `,
    },
    {
      name: "parent selectors in include blocks (mixins)",
      code: `
        import s from './parentSelector8.scss';

        export default Foo = () => (
          <div className={s.foo}>
            <div className={s.foo_bar}></div>
          </div>
        );
      `,
    },
    {
      name: "file that can't be parsed should not give any error",
      code: `
        import s from './unparsable.scss';

        export default Foo = () => (
          <div className={s.bar}>
            <div className={s.baz}></div>
          </div>
        );
      `,
    },
    {
      name: "global is ignored",
      code: `
        import s from './global1.scss';

        export default Foo = () => (
          <div className={s.local1, s.local2, s.local3, s.local4, s.local5, s.local6}>
          </div>
        );
      `,
    },
    {
      name: "ICSS :export pseudo-selector with correct prop name",
      code: `
        import s from './export1.scss';

        export default Foo = () => (
          <div className={s.bar}>
            <div className={s.myProp}></div>
          </div>
        );
      `,
    },
    {
      name: "camelCase=true classes work as expected",
      code: `
        import s from './noUndefClass3.scss';

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
        import s from './noUndefClass3.scss';

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
        import s from './noUndefClass3.scss';

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
        import s from './noUndefClass3.scss';

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
        import s from './noUndefClass3.scss';

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
        import s from './noUndefClass3.scss';

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
      name: "dot notation",
      code: `
        import s from './noUndefClass1.scss';

        export default Foo = () => (
          <div className={s.containr}></div>
        );
      `,
      errors: [
        { message: "Class or exported property 'containr' not found" },
      ],
    },
    {
      name: "square bracket",
      code: `
        import s from './noUndefClass1.scss';

        export default Foo = () => (
          <div className={s['containr']}></div>
        );
      `,
      errors: [
        { message: "Class or exported property 'containr' not found" },
      ],
    },
    {
      name: "classes with global scope for selector are ignored",
      code: `
        import s from './global1.scss';

        export default Foo = () => (
          <div className={s.global1, s.global2, s.global3}></div>
        );
      `,
      errors: [
        { message: "Class or exported property 'global1' not found" },
        { message: "Class or exported property 'global2' not found" },
        { message: "Class or exported property 'global3' not found" },
      ],
    },
    {
      name: "ICSS :export pseudo-selector with wrong prop name",
      code: `
        import s from './export2.scss';

        export default Foo = () => (
          <div className={s.bar}>
            <div className={s.myProp}></div>
          </div>
        );
      `,
      errors: [
        { message: "Class or exported property 'myProp' not found" },
      ],
    },
    {
      name: "check less support",
      code: `
        import s from './noUndefClass1.less';

        export default Foo = () => (
          <div className={s.bold}></div>
        );
      `,
      errors: [
        { message: "Class or exported property 'bold' not found" },
      ],
    },
    {
      name: "using composes",
      code: `
        import s from './composes1.scss';

        export default Foo = () => (
          <div className={s.bar}>
            <div className={s.bazz}></div>
          </div>
        );
      `,
      errors: [
        { message: "Class or exported property 'bazz' not found" },
      ],
    },
    {
      name: "composing multiple classes",
      code: `
        import s from './composesMultiple1.scss';

        export default Foo = () => (
          <div className={s.bar}>
            <div className={s.bazz} />
            <div className={s.foo} />
          </div>
        );
      `,
      errors: [
        { message: "Class or exported property 'bazz' not found" },
      ],
    },
    {
      name: "using @extend",
      code: `
        import s from './extend1.scss';

        export default Foo = () => (
          <div className={s.bar}>
            <div className={s.bazz}></div>
          </div>
        );
      `,
      errors: [
        { message: "Class or exported property 'bazz' not found" },
      ],
    },
    {
      name: "using parent selector (&)",
      code: `
        import s from './parentSelector1.scss';

        export default Foo = () => (
          <div className={s.foo}>
            <div className={s.foo_bar}></div>
            <div className={s.foo_baz}></div>
          </div>
        );
      `,
      errors: [
        { message: "Class or exported property 'foo_baz' not found" },
      ],
    },
    {
      name: "should show errors for file that does not exist",
      code: `
        import s from './fileThatDoesNotExist.scss';

        export default Foo = () => (
          <div className={s.bar}>
            <div className={s.baz}></div>
          </div>
        );
      `,
      errors: [
        { message: "Class or exported property 'bar' not found" },
        { message: "Class or exported property 'baz' not found" },
      ],
    },
    {
      name: "camelCase=true undef detection",
      code: `
        import s from './noUndefClass3.scss';

        export default Foo = () => (
          <div className={s.fooBar}>
            <div className={s.alreadyCamelCased}></div>
            <div className={s.snakeCased}></div>
            <div className={s.fooBaz}></div>
          </div>
        );
      `,
      options: [{ camelCase: true }],
      errors: [
        { message: "Class or exported property 'fooBaz' not found" },
      ],
    },
    {
      name: "camelCase=true with original names undef detection",
      code: `
        import s from './noUndefClass3.scss';

        export default Foo = () => (
          <div className={s['foo-bar']}>
            <div className={s.alreadyCamelCased}></div>
            <div className={s.snake_cased}></div>
            <div className={s['foo-baz']}></div>
          </div>
        );
      `,
      options: [{ camelCase: true }],
      errors: [
        { message: "Class or exported property 'foo-baz' not found" },
      ],
    },
    {
      name: "camelCase=dashes undef detection",
      code: `
        import s from './noUndefClass3.scss';

        export default Foo = () => (
          <div>
            <div className={s.fooBar}></div>
            <div className={s.alreadyCamelCased}></div>
            <div className={s.snakeCased}></div>
            <div className={s.fooBaz}></div>

            <div className={s['foo-bar']}></div>
            <div className={s['already-camel-cased']}></div>
            <div className={s.snake_cased}></div>
            <div className={s['foo-baz']}></div>
          </div>
        );
      `,
      options: [{ camelCase: "dashes" }],
      errors: [
        { message: "Class or exported property 'snakeCased' not found" },
        { message: "Class or exported property 'fooBaz' not found" },
        {
          message:
            "Class or exported property 'already-camel-cased' not found",
        },
        { message: "Class or exported property 'foo-baz' not found" },
      ],
    },
    {
      name: "camelCase=only undef detection",
      code: `
        import s from './noUndefClass3.scss';

        export default Foo = () => (
          <div>
            <div className={s.fooBar}></div>
            <div className={s.alreadyCamelCased}></div>
            <div className={s.snakeCased}></div>
            <div className={s.fooBaz}></div>

            <div className={s['foo-bar']}></div>
            <div className={s['already-camel-cased']}></div>
            <div className={s.snake_cased}></div>
            <div className={s['foo-baz']}></div>
          </div>
        );
      `,
      options: [{ camelCase: "only" }],
      errors: [
        { message: "Class or exported property 'fooBaz' not found" },
        { message: "Class or exported property 'foo-bar' not found" },
        {
          message:
            "Class or exported property 'already-camel-cased' not found",
        },
        { message: "Class or exported property 'snake_cased' not found" },
        { message: "Class or exported property 'foo-baz' not found" },
      ],
    },
    {
      name: "camelCase=dashes-only undef detection",
      code: `
        import s from './noUndefClass3.scss';

        export default Foo = () => (
          <div>
            <div className={s.fooBar}></div>
            <div className={s.alreadyCamelCased}></div>
            <div className={s.snakeCased}></div>
            <div className={s.fooBaz}></div>

            <div className={s['foo-bar']}></div>
            <div className={s['already-camel-cased']}></div>
            <div className={s.snake_cased}></div>
            <div className={s['foo-baz']}></div>
          </div>
        );
      `,
      options: [{ camelCase: "dashes-only" }],
      errors: [
        { message: "Class or exported property 'snakeCased' not found" },
        { message: "Class or exported property 'fooBaz' not found" },
        { message: "Class or exported property 'foo-bar' not found" },
        {
          message:
            "Class or exported property 'already-camel-cased' not found",
        },
        { message: "Class or exported property 'foo-baz' not found" },
      ],
    },
  ].map(addFilename),
});
