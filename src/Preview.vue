<script setup lang="ts">
import { PreviewType } from './types';

const props = defineProps<{
  src: string;
  type?: PreviewType;
}>();

const previewType = props.type || PreviewType.Default;
</script>

<template>
  <div class="code-group-preview" :data-preview-type="previewType">
    <iframe
      :src="decodeURIComponent(props.src)"
      class="code-group-preview-frame"
    />
  </div>
</template>

<style lang="scss">
.code-group-preview {
  height: 384px;
  margin-top: 16px;
  overflow: hidden;
  border-bottom: 1px solid var(--vp-code-tab-divider);
  margin-left: -24px;
  margin-right: -24px;

  .code-group-preview-frame {
    width: 100%;
    height: 100%;
    border: none;
  }

  &[data-preview-type="preview-no-code"] {
    border-radius: 8px;
    border: 1px solid var(--vp-code-tab-divider);
    margin-bottom: 16px;

    & + .vp-code-group {
      display: none !important;
    }
  }
}

.code-group-preview ~ .vp-code-group {
  margin-top: 0;
}

@media (min-width: 640px) {
  .code-group-preview {
    border-radius: 8px 8px 0 0;
    margin-right: 0;
    margin-left: 0;

    &[data-preview-type="preview-no-code"] {
      border-radius: 8px;
    }
  }

  .code-group-preview ~ .vp-code-group {
    .tabs {
      border-radius: 0;
    }
  }
}
</style>
