<template>
    <div>
        <h1>{{ myTitle }}</h1>
        <p>This is a simple example of a Vue.js component.</p>
    </div>
</template>
<script>
import { ref } from 'vue';
export default {
    setup() {
        const myTitle = ref('Vue.js');
        return {
            myTitle,
        };
    }
}
</script>