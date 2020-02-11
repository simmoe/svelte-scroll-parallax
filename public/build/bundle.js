
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.head.appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    const seen_callbacks = new Set();
    function flush() {
        do {
            // first, call beforeUpdate functions
            // and update components
            while (dirty_components.length) {
                const component = dirty_components.shift();
                set_current_component(component);
                update(component.$$);
            }
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined' ? window : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.18.1' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
    }

    /* src/components/TurningImageBottom.svelte generated by Svelte v3.18.1 */

    const { console: console_1 } = globals;
    const file = "src/components/TurningImageBottom.svelte";

    // (48:0) {#if (scrollPos >= scrollStart) && !destroy}
    function create_if_block(ctx) {
    	let img;
    	let img_src_value;
    	let dispose;

    	const block = {
    		c: function create() {
    			img = element("img");
    			attr_dev(img, "class", "absbottom svelte-1om0m0v");
    			if (img.src !== (img_src_value = /*src*/ ctx[2])) attr_dev(img, "src", img_src_value);
    			set_style(img, "transform", "perspective(" + /*perspective*/ ctx[7] + ") \n\t\ttranslate3d(0, -" + /*imgYCounter*/ ctx[4] + "px, " + /*imageZCounter*/ ctx[5] + "px");
    			attr_dev(img, "alt", "heres a bird for you");
    			add_location(img, file, 48, 0, 1540);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);
    			dispose = listen_dev(img, "load", /*whoosh*/ ctx[8], false, false, false);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*src*/ 4 && img.src !== (img_src_value = /*src*/ ctx[2])) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*imgYCounter, imageZCounter*/ 48) {
    				set_style(img, "transform", "perspective(" + /*perspective*/ ctx[7] + ") \n\t\ttranslate3d(0, -" + /*imgYCounter*/ ctx[4] + "px, " + /*imageZCounter*/ ctx[5] + "px");
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(48:0) {#if (scrollPos >= scrollStart) && !destroy}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let if_block_anchor;
    	let dispose;
    	add_render_callback(/*onwindowresize*/ ctx[14]);
    	let if_block = /*scrollPos*/ ctx[0] >= /*scrollStart*/ ctx[1] && !/*destroy*/ ctx[6] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			dispose = listen_dev(window, "resize", /*onwindowresize*/ ctx[14]);
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*scrollPos*/ ctx[0] >= /*scrollStart*/ ctx[1] && !/*destroy*/ ctx[6]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { scrollPos } = $$props, { scrollStart } = $$props, { src } = $$props;

    	//Check scroll direction
    	let lastScrollPos = 0;

    	function scrollDir(scrollPos) {
    		let ret = scrollPos - lastScrollPos < 0 ? "up" : "down";
    		lastScrollPos = scrollPos;
    		return ret;
    	}

    	let perspective = "1000px";

    	//debug those values if you like
    	// $: console.log({imageZCounter, imgHeight, imgYCounter, localScrollPos, scrollDirection, scrollStart})
    	//the height of the source image
    	let imgHeight, viewport;

    	function whoosh(e) {
    		$$invalidate(10, imgHeight = e.target.offsetHeight);
    	}

    	const writable_props = ["scrollPos", "scrollStart", "src"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<TurningImageBottom> was created with unknown prop '${key}'`);
    	});

    	function onwindowresize() {
    		$$invalidate(3, viewport = window.innerHeight);
    	}

    	$$self.$set = $$props => {
    		if ("scrollPos" in $$props) $$invalidate(0, scrollPos = $$props.scrollPos);
    		if ("scrollStart" in $$props) $$invalidate(1, scrollStart = $$props.scrollStart);
    		if ("src" in $$props) $$invalidate(2, src = $$props.src);
    	};

    	$$self.$capture_state = () => {
    		return {
    			scrollPos,
    			scrollStart,
    			src,
    			lastScrollPos,
    			perspective,
    			imgHeight,
    			viewport,
    			localScrollPos,
    			scrollDirection,
    			imgYCounter,
    			imageZCounter,
    			destroy
    		};
    	};

    	$$self.$inject_state = $$props => {
    		if ("scrollPos" in $$props) $$invalidate(0, scrollPos = $$props.scrollPos);
    		if ("scrollStart" in $$props) $$invalidate(1, scrollStart = $$props.scrollStart);
    		if ("src" in $$props) $$invalidate(2, src = $$props.src);
    		if ("lastScrollPos" in $$props) lastScrollPos = $$props.lastScrollPos;
    		if ("perspective" in $$props) $$invalidate(7, perspective = $$props.perspective);
    		if ("imgHeight" in $$props) $$invalidate(10, imgHeight = $$props.imgHeight);
    		if ("viewport" in $$props) $$invalidate(3, viewport = $$props.viewport);
    		if ("localScrollPos" in $$props) $$invalidate(11, localScrollPos = $$props.localScrollPos);
    		if ("scrollDirection" in $$props) $$invalidate(12, scrollDirection = $$props.scrollDirection);
    		if ("imgYCounter" in $$props) $$invalidate(4, imgYCounter = $$props.imgYCounter);
    		if ("imageZCounter" in $$props) $$invalidate(5, imageZCounter = $$props.imageZCounter);
    		if ("destroy" in $$props) $$invalidate(6, destroy = $$props.destroy);
    	};

    	let localScrollPos;
    	let scrollDirection;
    	let imgYCounter;
    	let imageZCounter;
    	let destroy;

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*scrollPos, scrollStart*/ 3) {
    			//subtract the current scrollposition from the dynamic variable to get a local scroll starting from zero 
    			 $$invalidate(11, localScrollPos = scrollPos - scrollStart);
    		}

    		if ($$self.$$.dirty & /*scrollPos*/ 1) {
    			 $$invalidate(12, scrollDirection = scrollDir(scrollPos));
    		}

    		if ($$self.$$.dirty & /*localScrollPos, imgHeight, scrollDirection, imgYCounter*/ 7184) {
    			//what we actually want is to count up to the images full height on the y-axis, and then go down again     	
    			 $$invalidate(4, imgYCounter = localScrollPos < imgHeight
    			? localScrollPos
    			: scrollDirection == "down"
    				? imgYCounter - 1
    				: imgYCounter + 1);
    		}

    		if ($$self.$$.dirty & /*localScrollPos*/ 2048) {
    			 $$invalidate(5, imageZCounter = -localScrollPos * 0.8);
    		}

    		if ($$self.$$.dirty & /*localScrollPos, imgHeight*/ 3072) {
    			//check if we need to show the component - but take some z-axis into consideration here
    			 $$invalidate(6, destroy = localScrollPos > imgHeight * 3);
    		}

    		if ($$self.$$.dirty & /*viewport*/ 8) {
    			 console.log(viewport);
    		}
    	};

    	return [
    		scrollPos,
    		scrollStart,
    		src,
    		viewport,
    		imgYCounter,
    		imageZCounter,
    		destroy,
    		perspective,
    		whoosh,
    		lastScrollPos,
    		imgHeight,
    		localScrollPos,
    		scrollDirection,
    		scrollDir,
    		onwindowresize
    	];
    }

    class TurningImageBottom extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { scrollPos: 0, scrollStart: 1, src: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TurningImageBottom",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*scrollPos*/ ctx[0] === undefined && !("scrollPos" in props)) {
    			console_1.warn("<TurningImageBottom> was created without expected prop 'scrollPos'");
    		}

    		if (/*scrollStart*/ ctx[1] === undefined && !("scrollStart" in props)) {
    			console_1.warn("<TurningImageBottom> was created without expected prop 'scrollStart'");
    		}

    		if (/*src*/ ctx[2] === undefined && !("src" in props)) {
    			console_1.warn("<TurningImageBottom> was created without expected prop 'src'");
    		}
    	}

    	get scrollPos() {
    		throw new Error("<TurningImageBottom>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set scrollPos(value) {
    		throw new Error("<TurningImageBottom>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get scrollStart() {
    		throw new Error("<TurningImageBottom>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set scrollStart(value) {
    		throw new Error("<TurningImageBottom>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get src() {
    		throw new Error("<TurningImageBottom>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set src(value) {
    		throw new Error("<TurningImageBottom>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const subscriber_queue = [];
    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier}start start and stop notifications for subscriptions
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe,
        };
    }
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    /* src/App.svelte generated by Svelte v3.18.1 */
    const file$1 = "src/App.svelte";

    function create_fragment$1(ctx) {
    	let scrolling = false;

    	let clear_scrolling = () => {
    		scrolling = false;
    	};

    	let scrolling_timeout;
    	let div1;
    	let div0;
    	let h3;
    	let t0;
    	let t1;
    	let div2;
    	let t2;
    	let t3;
    	let t4;
    	let current;
    	let dispose;
    	add_render_callback(/*onwindowscroll*/ ctx[12]);
    	add_render_callback(/*onwindowresize*/ ctx[13]);

    	const turningimagebottom0 = new TurningImageBottom({
    			props: {
    				scrollStart: "0",
    				scrollPos: /*scrollPos*/ ctx[2],
    				src: "./img/tree.png"
    			},
    			$$inline: true
    		});

    	const turningimagebottom1 = new TurningImageBottom({
    			props: {
    				scrollStart: "400",
    				scrollPos: /*scrollPos*/ ctx[2],
    				src: "./img/japflowers.webp"
    			},
    			$$inline: true
    		});

    	const turningimagebottom2 = new TurningImageBottom({
    			props: {
    				scrollStart: "1000",
    				scrollPos: /*scrollPos*/ ctx[2],
    				src: "./img/flowers.png"
    			},
    			$$inline: true
    		});

    	const turningimagebottom3 = new TurningImageBottom({
    			props: {
    				scrollStart: "1900",
    				scrollPos: /*scrollPos*/ ctx[2],
    				src: "./img/beach.png"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			h3 = element("h3");
    			t0 = text(/*scrollPos*/ ctx[2]);
    			t1 = space();
    			div2 = element("div");
    			create_component(turningimagebottom0.$$.fragment);
    			t2 = space();
    			create_component(turningimagebottom1.$$.fragment);
    			t3 = space();
    			create_component(turningimagebottom2.$$.fragment);
    			t4 = space();
    			create_component(turningimagebottom3.$$.fragment);
    			attr_dev(h3, "class", "svelte-l5l0yw");
    			add_location(h3, file$1, 66, 6, 1256);
    			add_location(div0, file$1, 66, 1, 1251);
    			attr_dev(div1, "class", "menu svelte-l5l0yw");
    			add_location(div1, file$1, 65, 0, 1231);
    			attr_dev(div2, "class", "pageheight");
    			set_style(div2, "height", 6000 + "px");
    			add_location(div2, file$1, 71, 0, 1463);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, h3);
    			append_dev(h3, t0);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div2, anchor);
    			mount_component(turningimagebottom0, div2, null);
    			append_dev(div2, t2);
    			mount_component(turningimagebottom1, div2, null);
    			append_dev(div2, t3);
    			mount_component(turningimagebottom2, div2, null);
    			append_dev(div2, t4);
    			mount_component(turningimagebottom3, div2, null);
    			current = true;

    			dispose = [
    				listen_dev(window, "keydown", handleKeydown, false, false, false),
    				listen_dev(window, "mousemove", /*handleMousemove*/ ctx[3], false, false, false),
    				listen_dev(window, "scroll", () => {
    					scrolling = true;
    					clearTimeout(scrolling_timeout);
    					scrolling_timeout = setTimeout(clear_scrolling, 100);
    					/*onwindowscroll*/ ctx[12]();
    				}),
    				listen_dev(window, "resize", /*onwindowresize*/ ctx[13])
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*y*/ 1 && !scrolling) {
    				scrolling = true;
    				clearTimeout(scrolling_timeout);
    				scrollTo(window.pageXOffset, /*y*/ ctx[0]);
    				scrolling_timeout = setTimeout(clear_scrolling, 100);
    			}

    			if (!current || dirty & /*scrollPos*/ 4) set_data_dev(t0, /*scrollPos*/ ctx[2]);
    			const turningimagebottom0_changes = {};
    			if (dirty & /*scrollPos*/ 4) turningimagebottom0_changes.scrollPos = /*scrollPos*/ ctx[2];
    			turningimagebottom0.$set(turningimagebottom0_changes);
    			const turningimagebottom1_changes = {};
    			if (dirty & /*scrollPos*/ 4) turningimagebottom1_changes.scrollPos = /*scrollPos*/ ctx[2];
    			turningimagebottom1.$set(turningimagebottom1_changes);
    			const turningimagebottom2_changes = {};
    			if (dirty & /*scrollPos*/ 4) turningimagebottom2_changes.scrollPos = /*scrollPos*/ ctx[2];
    			turningimagebottom2.$set(turningimagebottom2_changes);
    			const turningimagebottom3_changes = {};
    			if (dirty & /*scrollPos*/ 4) turningimagebottom3_changes.scrollPos = /*scrollPos*/ ctx[2];
    			turningimagebottom3.$set(turningimagebottom3_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(turningimagebottom0.$$.fragment, local);
    			transition_in(turningimagebottom1.$$.fragment, local);
    			transition_in(turningimagebottom2.$$.fragment, local);
    			transition_in(turningimagebottom3.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(turningimagebottom0.$$.fragment, local);
    			transition_out(turningimagebottom1.$$.fragment, local);
    			transition_out(turningimagebottom2.$$.fragment, local);
    			transition_out(turningimagebottom3.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div2);
    			destroy_component(turningimagebottom0);
    			destroy_component(turningimagebottom1);
    			destroy_component(turningimagebottom2);
    			destroy_component(turningimagebottom3);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    //Keyboard
    function handleKeydown(event) {
    	console.log(event.key);
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let seconds = 0;

    	const time = readable(new Date(), set => {
    		const interval = setInterval(
    			() => {
    				set(new Date().getSeconds());
    			},
    			1000
    		);

    		return () => clearInterval(interval);
    	});

    	const unsubscribe = time.subscribe(t => {
    		// console.log(seconds ++)
    		seconds++;
    	});

    	//scrolling
    	let y = 0;

    	//Dir check variable
    	let lastY = 0;

    	function scrollDir(y) {
    		let ret = y - lastY < 0 ? "up" : "down";
    		lastY = y;
    		return ret;
    	}

    	let viewportHeight;
    	let scrollSpeed = 8;

    	function handleMousemove(event) {
    		m.x = event.clientX;
    		m.y = event.clientY;
    		console.log(m);
    	}

    	function onwindowscroll() {
    		$$invalidate(0, y = window.pageYOffset);
    	}

    	function onwindowresize() {
    		$$invalidate(1, viewportHeight = window.innerHeight);
    	}

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("seconds" in $$props) seconds = $$props.seconds;
    		if ("y" in $$props) $$invalidate(0, y = $$props.y);
    		if ("lastY" in $$props) lastY = $$props.lastY;
    		if ("viewportHeight" in $$props) $$invalidate(1, viewportHeight = $$props.viewportHeight);
    		if ("scrollSpeed" in $$props) scrollSpeed = $$props.scrollSpeed;
    		if ("scrollPos" in $$props) $$invalidate(2, scrollPos = $$props.scrollPos);
    		if ("scrollDirection" in $$props) scrollDirection = $$props.scrollDirection;
    		if ("m" in $$props) m = $$props.m;
    	};

    	let scrollPos;
    	let scrollDirection;
    	let m;

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*y*/ 1) {
    			//Rounded y scroll value
    			 $$invalidate(2, scrollPos = Math.round(y));
    		}

    		if ($$self.$$.dirty & /*y*/ 1) {
    			 scrollDirection = scrollDir(y);
    		}
    	};

    	 m = { x: 0, y: 0 };

    	return [
    		y,
    		viewportHeight,
    		scrollPos,
    		handleMousemove,
    		seconds,
    		lastY,
    		scrollDirection,
    		m,
    		time,
    		unsubscribe,
    		scrollDir,
    		scrollSpeed,
    		onwindowscroll,
    		onwindowresize
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
