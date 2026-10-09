import "@mail/chatter/web/form_compiler";
import "@mail/chatter/web/form_renderer";

import { onWillUnmount } from "@odoo/owl";

import { browser } from "@web/core/browser/browser";
import { append, createElement, setAttributes } from "@web/core/utils/xml";
import { patch } from "@web/core/utils/patch";
import { FormCompiler } from "@web/views/form/form_compiler";
import { FormRenderer } from "@web/views/form/form_renderer";

const EXTRA_WIDTH_PROPERTY = "--Chatter-asideExtraWidth";
const RESIZED_CLASS = "o3p-resizable-chatter-resized";
const STORAGE_KEY = "o3p_resizable_chatter.extra_width";
const MIN_CHATTER_WIDTH = 280;
const MIN_FORM_WIDTH = 320;

patch(FormCompiler.prototype, {
    compile(node, params) {
        const result = super.compile(node, params);
        for (const chatter of result.querySelectorAll(".o-mail-Form-chatter")) {
            if (chatter.querySelector(".o3p-resizable-chatter-handle")) {
                continue;
            }
            setAttributes(chatter, {
                "t-att-class": `{ '${RESIZED_CLASS}': __comp__.o3pChatterExtraWidth !== null }`,
                "t-att-style": `__comp__.o3pChatterExtraWidth !== null ? '${EXTRA_WIDTH_PROPERTY}: ' + __comp__.o3pChatterExtraWidth + 'px;' : ''`,
            });
            const handle = createElement("div");
            handle.classList.add("o3p-resizable-chatter-handle");
            setAttributes(handle, {
                title: "Drag to resize; double-click to reset",
                "t-on-pointerdown.stop.prevent": "__comp__.onStartChatterResize",
                "t-on-dblclick.stop.prevent": "__comp__.onResetChatterWidth",
            });
            append(chatter, handle);
        }
        return result;
    },
});

patch(FormRenderer.prototype, {
    setup() {
        super.setup(...arguments);
        const storedExtraWidth = Number.parseFloat(browser.localStorage.getItem(STORAGE_KEY));
        this.o3pChatterExtraWidth = Number.isFinite(storedExtraWidth) ? storedExtraWidth : null;
        onWillUnmount(() => this._o3pStopChatterResize?.());
    },

    onStartChatterResize(event) {
        if (event.button !== 0) {
            return;
        }

        const chatter = event.currentTarget.parentElement;
        if (!chatter?.classList.contains("o-aside")) {
            return;
        }

        this._o3pStopChatterResize?.();

        const initialX = event.clientX;
        const initialWidth = chatter.getBoundingClientRect().width;
        let initialExtraWidth = Number.parseFloat(
            getComputedStyle(chatter).getPropertyValue(EXTRA_WIDTH_PROPERTY)
        );
        initialExtraWidth = Number.isFinite(initialExtraWidth) ? initialExtraWidth : 0;

        if (!chatter.classList.contains(RESIZED_CLASS)) {
            // Odoo's flex-grow may make the rendered chatter wider than its width
            // formula. Reflect that live difference into the existing CSS variable
            // before disabling the growth, so starting a drag causes no jump.
            chatter.classList.add(RESIZED_CLASS);
            const formulaWidth = chatter.getBoundingClientRect().width;
            initialExtraWidth += initialWidth - formulaWidth;
            chatter.style.setProperty(EXTRA_WIDTH_PROPERTY, `${initialExtraWidth}px`);
        }
        this.o3pChatterExtraWidth = initialExtraWidth;

        const containerWidth = chatter.parentElement.getBoundingClientRect().width;
        const maxChatterWidth = Math.max(MIN_CHATTER_WIDTH, containerWidth - MIN_FORM_WIDTH);

        const resize = (moveEvent) => {
            moveEvent.preventDefault();
            const requestedWidth = Math.min(
                maxChatterWidth,
                Math.max(MIN_CHATTER_WIDTH, initialWidth + initialX - moveEvent.clientX)
            );
            const extraWidth = initialExtraWidth + requestedWidth - initialWidth;
            chatter.style.setProperty(EXTRA_WIDTH_PROPERTY, `${extraWidth}px`);
            this.o3pChatterExtraWidth = extraWidth;
        };

        const stop = () => {
            window.removeEventListener("pointermove", resize);
            window.removeEventListener("pointerup", stop);
            window.removeEventListener("pointercancel", stop);
            window.removeEventListener("blur", stop);
            document.body.classList.remove("o3p-resizing-chatter");
            browser.localStorage.setItem(STORAGE_KEY, this.o3pChatterExtraWidth);
            this._o3pStopChatterResize = null;
        };

        this._o3pStopChatterResize = stop;
        document.body.classList.add("o3p-resizing-chatter");
        window.addEventListener("pointermove", resize);
        window.addEventListener("pointerup", stop);
        window.addEventListener("pointercancel", stop);
        window.addEventListener("blur", stop);
    },

    onResetChatterWidth(event) {
        const chatter = event.currentTarget.parentElement;
        chatter.style.removeProperty(EXTRA_WIDTH_PROPERTY);
        chatter.classList.remove(RESIZED_CLASS);
        this.o3pChatterExtraWidth = null;
        browser.localStorage.removeItem(STORAGE_KEY);
    },
});
