// import { getElementStyles } from './utils.js';

const carousel = document.querySelector('[data-carousel]');
const carouselTitle = carousel.querySelector('[data-display-title]');
const carouselTrack = carousel.querySelector('[data-track]');
const carouselItems = Array.from(carouselTrack.querySelectorAll('[data-id]'));

/**
 * @typedef {object} states
 * @property {number} count Designates the total states objects count.
 * @property {0 | 1 | -1} direction Designates the direction of movement of the carousel. 0: idle, 1: moving forwards or -1: moving backwards.
 * @property {number} length Designates the rendered carousel items count.
 * @property {(index: number) => any} get Method for getting a corresponding state object based on given index value. (The returned value depends on the direction.)
 * @property {(cb: (state: { scale: number, opacity: number, translateY: number}, index: number) => void, thisArg: any) => void} forEach Iterates the states objects and calls a callback function passing the corresponsing state object and its index position.
 */

let forEach = (Iterator.prototype.forEach, undefined);

/** @type states */
let states = {
    count: 5, // state objects count
    direction: 0, // direction: 0 | 1 | -1
    length: carouselItems.length, // length: number - carousel items count

    [Symbol.iterator]() {
        let i = 0;
        let value;
        let ctx = this;
        let res = { done: false };

        return {
            next(direction) {
                if (i > ctx.length - 1) {
                    res = { done: true, index: i, value };
                    return res;
                }

                if (i === 0) {
                    if (direction === 1) {
                        value = {
                            scale: 1.05,
                            opacity: 1,
                            translateY: -1
                        };
                    } else if (direction === -1) {
                        value = {
                            scale: 0.85,
                            opacity: 0.7,
                            translateY: 0.035
                        };
                    } else {
                        value = {
                            scale: 1,
                            opacity: 1,
                            translateY: 0
                        };
                    }
                }

                if (i === 1) {
                    if (direction === 1) {
                        value = {
                            scale: 1,
                            opacity: 1,
                            translateY: 0
                        };
                    } else if (direction === -1) {
                        value = {
                            scale: 0.7,
                            opacity: 0.3,
                            translateY: 0.07
                        };
                    } else {
                        value = {
                            scale: 0.85,
                            opacity: 0.7,
                            translateY: 0.035
                        };
                    }
                }

                if (i === 2) {
                    if (direction === 1) {
                        value = {
                            scale: 0.85,
                            opacity: 0.7,
                            translateY: 0.035
                        };
                    } else if (direction === -1) {
                        value = {
                            scale: 0.7,
                            opacity: 0,
                            translateY: 0.07
                        };
                    } else {
                        value = {
                            scale: 0.7,
                            opacity: 0.3,
                            translateY: 0.07
                        };
                    }
                }

                if (i === 3) {
                    if (direction === 1) {
                        value = {
                            scale: 0.7,
                            opacity: 0.3,
                            translateY: 0.07
                        };
                    } else {
                        value = {
                            scale: 0.7,
                            opacity: 0,
                            translateY: 0.07
                        };
                    }
                }

                if (i > 3) {
                    if (direction === -1 && i == ctx.length - 1) {
                        value = {
                            scale: 1.05,
                            opacity: 0,
                            translateY: 1
                        };
                    } else {
                        value = {
                            scale: 0.7,
                            opacity: 0,
                            translateY: 0.07
                        };
                    }
                }

                res = { done: false, index: i, value };
                i += 1;
                return res;
            },
            throw(exception) {
                return { done: true, index: i, exception };
            },
            return(value) {
                return { done: true, index: i, value };
            }
        }
    },

    get(index) {
        if (this[Symbol.iterator]) {
            return [...states][index];
        }
        return;
    },

    forEach(cb, thisArg) {
        if (forEach) {
            let iter = this[Symbol.iterator]?.();
            if (iter) forEach.call(iter, cb, thisArg);
        } else {
            let iter = this[Symbol.iterator]?.();
            if (iter) {
                let res = iter.next(this.direction);
                while (!res.done) {
                    if (thisArg) cb.call(thisArg, res.value, i);
                    else cb(res.value, res.index);
                    res = iter.next(this.direction);
                }
            }
        }
    }
};

let dragMinY = 10,
    dragMaxY = 90,
    /** @type {number} */
    dragStartY,
    dragProgress = 0,
    /** @type {0 | 1 | -1} */
    dragDirection = 1,
    carouselItemsStyles = [];

carouselItems.forEach((item, i) => {
    let state = states.get(i);
    if (state) {
        item.style.setProperty('--i', i);
        gsap.to(item, {
            alpha: state.opacity,
            scale: state.scale,
            y: state.translateY * item.clientHeight,
            duration: 0.3
        });
    }
});

setupDrag();

function setupDrag() {
    // Prevent default drag behavior
    carouselTrack.addEventListener('dragstart', () => false);
    carouselTrack.addEventListener('dragover', () => false);
    carouselTrack.addEventListener('dragend', () => false);

    carouselTrack.addEventListener('pointerdown', onDragStart);
}

function onDragStart(ev) {
    ev.preventDefault();

    dragStartY = ev.clientY - carouselTrack.clientTop;
    // carouselItemsStyles = carouselItems.map(getElementStyles);

    if (ev.pointerId) carouselTrack.setPointerCapture(ev.pointerId);
    carouselTrack.addEventListener('pointerup', onDragEnd);
    carouselTrack.addEventListener('pointermove', onDragMove);
}

function onDragEnd(ev) {
    ev.preventDefault();

    if (ev.pointerId) carouselTrack.releasePointerCapture(ev.pointerId);
    carouselTrack.removeEventListener('pointerup', ondragend);
    carouselTrack.removeEventListener('pointermove', ondrag);

    dragStartY = ev.clientY - carouselTrack.clientTop;
}

function onDragMove(ev) {
    ev.preventDefault();

    let dragDistance = (ev.clientY - carouselTrack.clientTop) - dragStartY;

    if (dragDistance < 0) {
        dragDirection = 1;
    } else if (dragDistance > 0) {
        dragDirection = -1;
    } else {
        dragDirection = 0;
    }
    if (Math.abs(dragDistance) < dragMinY) return;

    dragProgress = Math.min(Math.abs(dragDistance / dragMaxY), 1);
    console.log(dragDistance, dragProgress);
}