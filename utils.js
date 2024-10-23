export function debounce(fn, interval = 500, thisArg) {
    let timeout;

    return [
        function (...args) {

            if (timeout) clearTimeout(timeout);

            timeout = setTimeout(() => {
                if (thisArg) fn.apply(thisArg, args);
                else fn(...args);
            }, interval);
        },

        function () {
            if (timeout) clearTimeout(timeout);
        }
    ];
}

export function rotateArrayItems(array, direction = 1) {

    if (array.length > 1) {

        if (direction == 1) {

            const firstElement = array[0];

            for (let i = 1; i < array.length; i++) {
                array[i - 1] = array[i];
            }
    
            array[array.length - 1] = firstElement;

        } else if (direction == -1) {

            const lastElement = array[array.length - 1];

            for (let i = array.length - 1; i > 0; i--) {
                array[i] = array[i - 1];
            }

            array[0] = lastElement;
        }
    }

    return array;
}

export function getElementStyles(element) {
    let transform = element.style.transform;

    let scale = transform.match(/(?<=scale\()(?:\d+(?:\.\d+)?)/)?.[0] ?? 1;
    scale = Number(scale);

    let translateY = transform.match(/(?<=translateY\()(?:\d+(?:\.\d+)?)/)?.[0] ?? 0;
    translateY = translateY / 100;

    let opacity = element.style.opacity ?? 1;
    opacity = Number(opacity);

    return {
        scale,
        translateY,
        opacity
    };
}