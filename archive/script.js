// import {
//     debounce,
//     Easing,
//     interpolate,
//     rotateArrayItems,
//     awaitTransitions,
//     getElementStyles
// } from './utils.js';

const carousel = document.querySelector('[data-carousel]');
const carouselTitle = carousel.querySelector('[data-display-title]');
const carouselControls = carousel.querySelector('[data-controls]');
const carouselDisplayCurrent = carousel.querySelectorAll('[data-display-current]');
const carouselDisplayTotal = carousel.querySelector('[data-display-total]');
const carouselTrack = carousel.querySelector('[data-track]');
const carouselItems = Array.from(carouselTrack.querySelectorAll('[data-id]'));

let isLocked = true;
let activeItemeId = 1;

let states = [
    // first element in queue state
    // when running carousel forwards
    {
        scale: 1.05,
        opacity: 1,
        translateY: -1
    },
    // fist element in queue state
    {
        scale: 1,
        opacity: 1,
        translateY: 0
    },
    // second element in queue state
    {
        scale: 0.85,
        opacity: 0.7,
        translateY: 0.035
    },
    // third element in queue state
    {
        scale: 0.7,
        opacity: 0.3,
        translateY: 0.07
    },
    // all other elements in queue states
    {
        scale: 0.7,
        opacity: 0,
        translateY: 0.07
    },
    // last element in queue state
    // when running carousel backwards
    {
        scale: 1.05,
        opacity: 0,
        translateY: 1
    }
];

let applyUpdate = function () {
    let firstElement = carouselItems[0];
    if (firstElement) {
        if (firstElement.dataset.id !== activeItemeId) {
            activeItemeId = firstElement.dataset.id;
            updatePagination();
            updateItems();
        }
    }
};

if (document.readyState === 'complete') {
    load();
} else {
    document.addEventListener('DOMContentLoaded', load);
}


function load() {
    document.removeEventListener('DOMContentLoaded', load);

    applyUpdate();
    setupDrag();
}

function updateItems() {

    carouselItems.forEach((item, key) => {

        item.addEventListener('transitionend', (ev) => {
            item.classList.remove('in-transition');
            isLocked = false;
        });

        let index = Math.min(key + 1, 4);
        let state = states[index];

        if (!item.dataset.loadedImage)
            item.dataset.loadedImage = 'false';

        item.classList.add('in-transition');
        item.style.setProperty('--i', key);
        item.style.setProperty('opacity', state.opacity);
        item.style.setProperty('transform', `scale(${state.scale}) translateY(${state.translateY * 100}%)`);

        if (key < 4) loadImage(item);
    });
}

function loadImage(element) {
    let img = element.querySelector('img');
    if (!img || !img.dataset.src) return;

    if (!element.dataset.loadedImage || element.dataset.loadedImage == 'false') {

        let loader = element.querySelector('.loader');
        if (!loader) {
            loader = document.createElement('div');
            loader.classList.add('loader');
            element.appendChild(loader);
        }

        img.addEventListener('load', (ev) => {
            element.dataset.loadedImage = 'true';
            if (ev.target.complete) loader.remove();
            img.removeAttribute('data-src');
        });

        img.src = img.dataset.src;
    }
}

function updatePagination() {
    carouselDisplayCurrent.forEach(el => {
        el.textContent = activeItemeId;
    });

    if (carouselDisplayTotal.textContent != carouselItems.length) {
        carouselDisplayTotal.textContent = carouselItems.length;
    }
}

function setupDrag() {
    let minY = 10;
    let maxY = 90;
    let startY;
    let direction = 1;
    let progress = 0;

    let currentStyles = [];

    // Prevent default drag behavior
    carouselTrack.addEventListener('dragstart', () => false);
    carouselTrack.addEventListener('dragover', () => false);
    carouselTrack.addEventListener('dragend', () => false);

    carouselTrack.addEventListener('pointerdown', ondragstart);

    function ondragstart(ev) {
        ev.preventDefault();

        if (isLocked) return;

        carouselTrack.classList.add('is-dragged');
        startY = ev.clientY - carouselTrack.clientTop;
        currentStyles = carouselItems.map(getElementStyles);

        if (ev.pointerId) carouselTrack.setPointerCapture(ev.pointerId);
        carouselTrack.addEventListener('pointerup', ondragend);
        carouselTrack.addEventListener('pointermove', ondrag);
    }

    function ondragend(ev) {
        ev.preventDefault();

        if (ev.pointerId) carouselTrack.releasePointerCapture(ev.pointerId);
        carouselTrack.removeEventListener('pointerup', ondragend);
        carouselTrack.removeEventListener('pointermove', ondrag);

        startY = ev.clientY - carouselTrack.clientTop;

        if (progress < 1) {

            carouselItems.forEach((item, key) => {
                item.classList.add('in-transition');
                console.log('Element', item);

                awaitTransitions(item, 'opacity', 'transform')
                    .then((element) => {
                        console.log(element);
                        isLocked = false;
                        element.classList.remove('in-transition');
                        carouselTrack.classList.remove('is-dragged');
                    })
                    .catch((error) => {
                        console.error(error);
                    });

                item.style.setProperty('opacity', `${currentStyles[key].opacity}`);
                item.style.setProperty('transform', `scale(${currentStyles[key].scale}) translateY(${currentStyles[key].translateY * 100}%)`);
            });
        } else {

            applyUpdate();
            carouselTrack.classList.remove('is-dragged');
        }
    }

    function ondrag(ev) {
        ev.preventDefault();

        if (isLocked) return;

        let dist = (ev.clientY - carouselTrack.clientTop) - startY;
        direction = dist < 0 ? 1 : -1;

        if (Math.abs(dist) < minY) return;

        progress = Math.min(Math.abs(dist / maxY), 1);

        // direction -> forwards
        if (direction === 1) {

            carouselItems.slice(0, 4).forEach((item, key) => {
                let targetStyles = states[Math.min(key, 3)];

                let opacity = interpolate(currentStyles[key].opacity, targetStyles.opacity, Easing.easeInOutQuad(progress));
                let scale = interpolate(currentStyles[key].scale, targetStyles.scale, Easing.easeInOutQuad(progress));
                let translateY = interpolate(currentStyles[key].translateY, targetStyles.translateY, Easing.easeInOutQuad(progress));

                item.style.setProperty('opacity', `${opacity}`);
                item.style.setProperty('transform', `scale(${scale}) translateY(${translateY * 100}%)`);
            });

            if (progress == 1) {
                isLocked = true;
                rotateArrayItems(carouselItems);
                ondragend(ev);
            }

            return;
        }

        // direction -> backwards
        carouselItems.slice(0, 4).forEach((item, key) => {
            let from = currentStyles[key];
            let to = states[Math.min(key + 2, 4)];

            let opacity = interpolate(from.opacity, to.opacity, Easing.easeInOutQuad(progress));
            let scale = interpolate(from.scale, to.scale, Easing.easeInOutQuad(progress));
            let translateY = interpolate(from.translateY, to.translateY, Easing.easeInOutQuad(progress));

            item.style.setProperty('opacity', `${opacity}`);
            item.style.setProperty('transform', `scale(${scale}) translateY(${translateY * 100}%)`);
        });

        let lastElement = carouselItems.slice(-1)[0];

        if (lastElement) {
            loadImage(lastElement);
            lastElement.style.setProperty('--i', 0);

            let from = states[states.length - 1];
            let to = states[1];

            let opacity = interpolate(from.opacity, to.opacity, Easing.easeInOutQuad(progress));
            let scale = interpolate(from.scale, to.scale, Easing.easeInOutQuad(progress));
            let translateY = interpolate(from.translateY, to.translateY, Easing.easeInOutQuad(progress));

            lastElement.style.setProperty('opacity', `${opacity}`);
            lastElement.style.setProperty('transform', `scale(${scale}) translateY(${translateY * 100}%)`);
        }

        if (progress == 1) {
            isLocked = true;
            rotateArrayItems(carouselItems, -1);
            console.log(carouselItems);
            ondragend(ev);
        }
    }
}
