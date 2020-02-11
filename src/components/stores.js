import { readable } from 'svelte/store';

//seconds
export const seconds = readable(new Date(), set => {
    const interval = setInterval(() => {
        set(new Date().getSeconds())
    }, 1000);

    return () => clearInterval(interval)
})
