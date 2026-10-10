<script setup lang="ts">
    import { computed, ref, watch } from 'vue'
    import { ElEmpty } from 'element-plus'
    import type { BlockFormData, Viewport } from '../types'

    const props = defineProps<{
        data: BlockFormData
        viewport: Viewport
    }>()

    const failed = ref(false)

    // 计算图片的地址
    const src = computed(
        () => props.data.src?.[props.viewport] ?? '',
    )
    
    // 计算图片的样式
    const styles = computed(() => {
        const height = props.data.height?.[props.viewport] ?? '295px'

        return {
            width: props.data.width?.[props.viewport] ?? '100%',
            height: typeof height === 'number' ? height + 'px' : height,
        }
    })

    watch(src, () => {
        failed.value = false
    })
</script>

<template>
    <div class="image-block" :style="styles">
        <!-- 图片有地址且没有加载失败时，显示图片。 浏览器加载图片失败时，会触发图片的 error 事件 -->
        <img v-if="src && !failed" :src="src" alt="页面图片" class="image" draggable="false" @error="failed = true" />

        <ElEmpty v-else :description="failed ? '图片加载失败，请检查地址' : '等待添加图片'" :image-size="64" class="no-image" />
    </div>
</template>

<style scoped>
.image-block {
    max-width: 100%;
    margin: 0 auto;
    overflow: hidden;
    background: #f5f6f7;
}

.image {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: contain;
}

.no-image {
    height: 100%;
    padding: 0;
}
</style>