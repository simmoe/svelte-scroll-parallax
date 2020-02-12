
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.head.appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
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
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if (typeof $$scope.dirty === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
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
    function add_resize_listener(element, fn) {
        if (getComputedStyle(element).position === 'static') {
            element.style.position = 'relative';
        }
        const object = document.createElement('object');
        object.setAttribute('style', 'display: block; position: absolute; top: 0; left: 0; height: 100%; width: 100%; overflow: hidden; pointer-events: none; z-index: -1;');
        object.setAttribute('aria-hidden', 'true');
        object.type = 'text/html';
        object.tabIndex = -1;
        let win;
        object.onload = () => {
            win = object.contentDocument.defaultView;
            win.addEventListener('resize', fn);
        };
        if (/Trident/.test(navigator.userAgent)) {
            element.appendChild(object);
            object.data = 'about:blank';
        }
        else {
            object.data = 'about:blank';
            element.appendChild(object);
        }
        return {
            cancel: () => {
                win && win.removeEventListener && win.removeEventListener('resize', fn);
                element.removeChild(object);
            }
        };
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

    //aka p5 map

    const  map_range = (value, low1, high1, low2, high2) => {
    };

    /* src/components/Cross.svelte generated by Svelte v3.18.1 */
    const file = "src/components/Cross.svelte";
    const get_custom_slot_changes = dirty => ({});
    const get_custom_slot_context = ctx => ({});
    const get_before_slot_changes = dirty => ({});
    const get_before_slot_context = ctx => ({});

    function create_fragment(ctx) {
    	let div2;
    	let div1;
    	let div0;
    	let t;
    	let div2_resize_listener;
    	let current;
    	const before_slot_template = /*$$slots*/ ctx[18].before;
    	const before_slot = create_slot(before_slot_template, ctx, /*$$scope*/ ctx[17], get_before_slot_context);
    	const custom_slot_template = /*$$slots*/ ctx[18].custom;
    	const custom_slot = create_slot(custom_slot_template, ctx, /*$$scope*/ ctx[17], get_custom_slot_context);

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			if (before_slot) before_slot.c();
    			t = space();
    			if (custom_slot) custom_slot.c();
    			attr_dev(div0, "class", "default svelte-7zoa75");
    			add_location(div0, file, 64, 2, 1673);
    			add_location(div1, file, 63, 1, 1665);
    			attr_dev(div2, "class", "abs svelte-7zoa75");
    			set_style(div2, "position", "fixed");
    			set_style(div2, "background-color", /*bgColor*/ ctx[0]);
    			set_style(div2, "background-image", "url(\"" + /*src*/ ctx[1] + "\")");
    			set_style(div2, "background-size", "cover");
    			set_style(div2, "background-position", "center center");
    			add_render_callback(() => /*div2_elementresize_handler*/ ctx[19].call(div2));
    			add_location(div2, file, 52, 0, 1412);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div1);
    			append_dev(div1, div0);

    			if (before_slot) {
    				before_slot.m(div0, null);
    			}

    			append_dev(div1, t);

    			if (custom_slot) {
    				custom_slot.m(div1, null);
    			}

    			div2_resize_listener = add_resize_listener(div2, /*div2_elementresize_handler*/ ctx[19].bind(div2));
    			/*div2_binding*/ ctx[20](div2);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (before_slot && before_slot.p && dirty & /*$$scope*/ 131072) {
    				before_slot.p(get_slot_context(before_slot_template, ctx, /*$$scope*/ ctx[17], get_before_slot_context), get_slot_changes(before_slot_template, /*$$scope*/ ctx[17], dirty, get_before_slot_changes));
    			}

    			if (custom_slot && custom_slot.p && dirty & /*$$scope*/ 131072) {
    				custom_slot.p(get_slot_context(custom_slot_template, ctx, /*$$scope*/ ctx[17], get_custom_slot_context), get_slot_changes(custom_slot_template, /*$$scope*/ ctx[17], dirty, get_custom_slot_changes));
    			}

    			if (!current || dirty & /*bgColor*/ 1) {
    				set_style(div2, "background-color", /*bgColor*/ ctx[0]);
    			}

    			if (!current || dirty & /*src*/ 2) {
    				set_style(div2, "background-image", "url(\"" + /*src*/ ctx[1] + "\")");
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(before_slot, local);
    			transition_in(custom_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(before_slot, local);
    			transition_out(custom_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			if (before_slot) before_slot.d(detaching);
    			if (custom_slot) custom_slot.d(detaching);
    			div2_resize_listener.cancel();
    			/*div2_binding*/ ctx[20](null);
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

    function getSeq(p1, p2, p3) {
    	if (p1 < p2) return 0;
    	if (p1 >= p3) return p3 - p2;
    	return p1 - p2;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { enter } = $$props, { leave } = $$props, { bgColor } = $$props;
    	let { src = "" } = $$props;

    	let { start } = $$props,
    		{ stop } = $$props,
    		{ cont } = $$props,
    		{ end } = $$props,
    		{ scrollPos = 0 } = $$props;

    	let height, width;
    	let x = 0;
    	let y = 0;

    	function reset() {
    		$$invalidate(12, x = 0);
    		$$invalidate(13, y = 0);
    	}

    	let el;

    	const writable_props = [
    		"enter",
    		"leave",
    		"bgColor",
    		"src",
    		"start",
    		"stop",
    		"cont",
    		"end",
    		"scrollPos"
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Cross> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;

    	function div2_elementresize_handler() {
    		height = this.clientHeight;
    		width = this.clientWidth;
    		$$invalidate(2, height);
    		$$invalidate(3, width);
    	}

    	function div2_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate(4, el = $$value);
    		});
    	}

    	$$self.$set = $$props => {
    		if ("enter" in $$props) $$invalidate(5, enter = $$props.enter);
    		if ("leave" in $$props) $$invalidate(6, leave = $$props.leave);
    		if ("bgColor" in $$props) $$invalidate(0, bgColor = $$props.bgColor);
    		if ("src" in $$props) $$invalidate(1, src = $$props.src);
    		if ("start" in $$props) $$invalidate(7, start = $$props.start);
    		if ("stop" in $$props) $$invalidate(8, stop = $$props.stop);
    		if ("cont" in $$props) $$invalidate(9, cont = $$props.cont);
    		if ("end" in $$props) $$invalidate(10, end = $$props.end);
    		if ("scrollPos" in $$props) $$invalidate(11, scrollPos = $$props.scrollPos);
    		if ("$$scope" in $$props) $$invalidate(17, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => {
    		return {
    			enter,
    			leave,
    			bgColor,
    			src,
    			start,
    			stop,
    			cont,
    			end,
    			scrollPos,
    			height,
    			width,
    			x,
    			y,
    			el,
    			seqIn,
    			seqOut
    		};
    	};

    	$$self.$inject_state = $$props => {
    		if ("enter" in $$props) $$invalidate(5, enter = $$props.enter);
    		if ("leave" in $$props) $$invalidate(6, leave = $$props.leave);
    		if ("bgColor" in $$props) $$invalidate(0, bgColor = $$props.bgColor);
    		if ("src" in $$props) $$invalidate(1, src = $$props.src);
    		if ("start" in $$props) $$invalidate(7, start = $$props.start);
    		if ("stop" in $$props) $$invalidate(8, stop = $$props.stop);
    		if ("cont" in $$props) $$invalidate(9, cont = $$props.cont);
    		if ("end" in $$props) $$invalidate(10, end = $$props.end);
    		if ("scrollPos" in $$props) $$invalidate(11, scrollPos = $$props.scrollPos);
    		if ("height" in $$props) $$invalidate(2, height = $$props.height);
    		if ("width" in $$props) $$invalidate(3, width = $$props.width);
    		if ("x" in $$props) $$invalidate(12, x = $$props.x);
    		if ("y" in $$props) $$invalidate(13, y = $$props.y);
    		if ("el" in $$props) $$invalidate(4, el = $$props.el);
    		if ("seqIn" in $$props) $$invalidate(14, seqIn = $$props.seqIn);
    		if ("seqOut" in $$props) $$invalidate(15, seqOut = $$props.seqOut);
    	};

    	let seqIn;
    	let seqOut;

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*scrollPos, start, stop*/ 2432) {
    			 $$invalidate(14, seqIn = getSeq(scrollPos, start, stop));
    		}

    		if ($$self.$$.dirty & /*scrollPos, cont, end*/ 3584) {
    			 $$invalidate(15, seqOut = getSeq(scrollPos, cont, end));
    		}

    		if ($$self.$$.dirty & /*scrollPos, start, stop, enter, seqIn, cont, end, leave, seqOut, x, y*/ 65504) {
    			 {
    				if (scrollPos > start && scrollPos <= stop) {
    					if (enter == "left") $$invalidate(12, x = map_range());
    					if (enter == "right") $$invalidate(12, x = -map_range());
    					if (enter == "top") $$invalidate(13, y = map_range());
    					if (enter == "bottom") $$invalidate(13, y = -map_range());
    				}

    				if (scrollPos > cont && scrollPos <= end) {
    					if (leave == "left") $$invalidate(12, x = -map_range());
    					if (leave == "right") $$invalidate(12, x = map_range());
    					if (leave == "top") $$invalidate(13, y = -map_range());
    					if (leave == "bottom") $$invalidate(13, y = map_range());
    				}

    				if (scrollPos > start) {
    					$$invalidate(4, el.style.visibility = "visible", el);
    					$$invalidate(4, el.style.transform = `translate(${x}%, ${y}%)`, el);
    				}
    			}
    		}

    		if ($$self.$$.dirty & /*stop, start, seqIn*/ 16768) {
    			//x y resetters
    			 stop - start - seqIn < 5 && reset();
    		}

    		if ($$self.$$.dirty & /*scrollPos, cont*/ 2560) {
    			 scrollPos > cont && scrollPos < cont + 5 && reset();
    		}
    	};

    	return [
    		bgColor,
    		src,
    		height,
    		width,
    		el,
    		enter,
    		leave,
    		start,
    		stop,
    		cont,
    		end,
    		scrollPos,
    		x,
    		y,
    		seqIn,
    		seqOut,
    		reset,
    		$$scope,
    		$$slots,
    		div2_elementresize_handler,
    		div2_binding
    	];
    }

    class Cross extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance, create_fragment, safe_not_equal, {
    			enter: 5,
    			leave: 6,
    			bgColor: 0,
    			src: 1,
    			start: 7,
    			stop: 8,
    			cont: 9,
    			end: 10,
    			scrollPos: 11
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Cross",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*enter*/ ctx[5] === undefined && !("enter" in props)) {
    			console.warn("<Cross> was created without expected prop 'enter'");
    		}

    		if (/*leave*/ ctx[6] === undefined && !("leave" in props)) {
    			console.warn("<Cross> was created without expected prop 'leave'");
    		}

    		if (/*bgColor*/ ctx[0] === undefined && !("bgColor" in props)) {
    			console.warn("<Cross> was created without expected prop 'bgColor'");
    		}

    		if (/*start*/ ctx[7] === undefined && !("start" in props)) {
    			console.warn("<Cross> was created without expected prop 'start'");
    		}

    		if (/*stop*/ ctx[8] === undefined && !("stop" in props)) {
    			console.warn("<Cross> was created without expected prop 'stop'");
    		}

    		if (/*cont*/ ctx[9] === undefined && !("cont" in props)) {
    			console.warn("<Cross> was created without expected prop 'cont'");
    		}

    		if (/*end*/ ctx[10] === undefined && !("end" in props)) {
    			console.warn("<Cross> was created without expected prop 'end'");
    		}
    	}

    	get enter() {
    		throw new Error("<Cross>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set enter(value) {
    		throw new Error("<Cross>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get leave() {
    		throw new Error("<Cross>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set leave(value) {
    		throw new Error("<Cross>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get bgColor() {
    		throw new Error("<Cross>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set bgColor(value) {
    		throw new Error("<Cross>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get src() {
    		throw new Error("<Cross>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set src(value) {
    		throw new Error("<Cross>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get start() {
    		throw new Error("<Cross>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set start(value) {
    		throw new Error("<Cross>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get stop() {
    		throw new Error("<Cross>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set stop(value) {
    		throw new Error("<Cross>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get cont() {
    		throw new Error("<Cross>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set cont(value) {
    		throw new Error("<Cross>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get end() {
    		throw new Error("<Cross>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set end(value) {
    		throw new Error("<Cross>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get scrollPos() {
    		throw new Error("<Cross>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set scrollPos(value) {
    		throw new Error("<Cross>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.18.1 */
    const file$1 = "src/App.svelte";

    // (33:2) <div slot='before'>
    function create_before_slot(ctx) {
    	let div;
    	let h1;
    	let t1;
    	let p;

    	const block = {
    		c: function create() {
    			div = element("div");
    			h1 = element("h1");
    			h1.textContent = "The old man and the sea";
    			t1 = space();
    			p = element("p");
    			p.textContent = "Lorem ipsum dolor sit amet consectetur adipisicing elit. Accusantium exercitationem earum sint aliquid magni, praesentium eos asperiores omnis enim iure nesciunt qui veniam consequuntur nisi laudantium maxime laboriosam ipsum. Deserunt.";
    			add_location(h1, file$1, 33, 3, 823);
    			add_location(p, file$1, 34, 3, 859);
    			attr_dev(div, "slot", "before");
    			add_location(div, file$1, 32, 2, 798);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h1);
    			append_dev(div, t1);
    			append_dev(div, p);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_before_slot.name,
    		type: "slot",
    		source: "(33:2) <div slot='before'>",
    		ctx
    	});

    	return block;
    }

    // (32:1) <Cross enter='right' leave='bottom' start={0}  stop={300} cont={400} end={700} scrollPos={scrollPos} bgColor='purple'>
    function create_default_slot_1(ctx) {
    	const block = { c: noop, m: noop, p: noop, d: noop };

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1.name,
    		type: "slot",
    		source: "(32:1) <Cross enter='right' leave='bottom' start={0}  stop={300} cont={400} end={700} scrollPos={scrollPos} bgColor='purple'>",
    		ctx
    	});

    	return block;
    }

    // (40:2) <div slot='custom'>
    function create_custom_slot(ctx) {
    	let div;
    	let h1;

    	const block = {
    		c: function create() {
    			div = element("div");
    			h1 = element("h1");
    			h1.textContent = "The sanctions";
    			attr_dev(h1, "class", "verybig svelte-16wzoux");
    			add_location(h1, file$1, 40, 3, 1251);
    			attr_dev(div, "slot", "custom");
    			add_location(div, file$1, 39, 2, 1228);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h1);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_custom_slot.name,
    		type: "slot",
    		source: "(40:2) <div slot='custom'>",
    		ctx
    	});

    	return block;
    }

    // (39:1) <Cross enter='top' leave='right' start={400}  stop={700} cont={800} end={1200} scrollPos={scrollPos}>
    function create_default_slot(ctx) {
    	const block = { c: noop, m: noop, p: noop, d: noop };

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(39:1) <Cross enter='top' leave='right' start={400}  stop={700} cont={800} end={1200} scrollPos={scrollPos}>",
    		ctx
    	});

    	return block;
    }

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
    	add_render_callback(/*onwindowscroll*/ ctx[6]);
    	add_render_callback(/*onwindowresize*/ ctx[7]);

    	const cross0 = new Cross({
    			props: {
    				enter: "right",
    				leave: "bottom",
    				start: 0,
    				stop: 300,
    				cont: 400,
    				end: 700,
    				scrollPos: /*scrollPos*/ ctx[3],
    				bgColor: "purple",
    				$$slots: {
    					default: [create_default_slot_1],
    					before: [create_before_slot]
    				},
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const cross1 = new Cross({
    			props: {
    				enter: "top",
    				leave: "right",
    				start: 400,
    				stop: 700,
    				cont: 800,
    				end: 1200,
    				scrollPos: /*scrollPos*/ ctx[3],
    				$$slots: {
    					default: [create_default_slot],
    					custom: [create_custom_slot]
    				},
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const cross2 = new Cross({
    			props: {
    				src: "./img/athmos4.JPG",
    				enter: "left",
    				leave: "bottom",
    				start: 800,
    				stop: 1200,
    				cont: 1400,
    				end: 1900,
    				scrollPos: /*scrollPos*/ ctx[3]
    			},
    			$$inline: true
    		});

    	const cross3 = new Cross({
    			props: {
    				src: "./img/bath100.JPG",
    				enter: "top",
    				leave: "right",
    				start: 1400,
    				stop: 1900,
    				cont: 2000,
    				end: 2300,
    				scrollPos: /*scrollPos*/ ctx[3]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			h3 = element("h3");
    			t0 = text(/*scrollPos*/ ctx[3]);
    			t1 = space();
    			div2 = element("div");
    			create_component(cross0.$$.fragment);
    			t2 = space();
    			create_component(cross1.$$.fragment);
    			t3 = space();
    			create_component(cross2.$$.fragment);
    			t4 = space();
    			create_component(cross3.$$.fragment);
    			attr_dev(h3, "class", "svelte-16wzoux");
    			add_location(h3, file$1, 27, 6, 556);
    			add_location(div0, file$1, 27, 1, 551);
    			attr_dev(div1, "class", "menu svelte-16wzoux");
    			add_location(div1, file$1, 26, 0, 531);
    			attr_dev(div2, "class", "pageheight");
    			set_style(div2, "height", /*scrollPos*/ ctx[3] + /*viewportHeight*/ ctx[2] + /*scrollSpeed*/ ctx[4] + "px");
    			add_location(div2, file$1, 30, 0, 591);
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
    			mount_component(cross0, div2, null);
    			append_dev(div2, t2);
    			mount_component(cross1, div2, null);
    			append_dev(div2, t3);
    			mount_component(cross2, div2, null);
    			append_dev(div2, t4);
    			mount_component(cross3, div2, null);
    			current = true;

    			dispose = [
    				listen_dev(window, "mousemove", /*handleMouseMove*/ ctx[0], false, false, false),
    				listen_dev(window, "scroll", () => {
    					scrolling = true;
    					clearTimeout(scrolling_timeout);
    					scrolling_timeout = setTimeout(clear_scrolling, 100);
    					/*onwindowscroll*/ ctx[6]();
    				}),
    				listen_dev(window, "resize", /*onwindowresize*/ ctx[7])
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*y*/ 2 && !scrolling) {
    				scrolling = true;
    				clearTimeout(scrolling_timeout);
    				scrollTo(window.pageXOffset, /*y*/ ctx[1]);
    				scrolling_timeout = setTimeout(clear_scrolling, 100);
    			}

    			if (!current || dirty & /*scrollPos*/ 8) set_data_dev(t0, /*scrollPos*/ ctx[3]);
    			const cross0_changes = {};
    			if (dirty & /*scrollPos*/ 8) cross0_changes.scrollPos = /*scrollPos*/ ctx[3];

    			if (dirty & /*$$scope*/ 256) {
    				cross0_changes.$$scope = { dirty, ctx };
    			}

    			cross0.$set(cross0_changes);
    			const cross1_changes = {};
    			if (dirty & /*scrollPos*/ 8) cross1_changes.scrollPos = /*scrollPos*/ ctx[3];

    			if (dirty & /*$$scope*/ 256) {
    				cross1_changes.$$scope = { dirty, ctx };
    			}

    			cross1.$set(cross1_changes);
    			const cross2_changes = {};
    			if (dirty & /*scrollPos*/ 8) cross2_changes.scrollPos = /*scrollPos*/ ctx[3];
    			cross2.$set(cross2_changes);
    			const cross3_changes = {};
    			if (dirty & /*scrollPos*/ 8) cross3_changes.scrollPos = /*scrollPos*/ ctx[3];
    			cross3.$set(cross3_changes);

    			if (!current || dirty & /*scrollPos, viewportHeight*/ 12) {
    				set_style(div2, "height", /*scrollPos*/ ctx[3] + /*viewportHeight*/ ctx[2] + /*scrollSpeed*/ ctx[4] + "px");
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(cross0.$$.fragment, local);
    			transition_in(cross1.$$.fragment, local);
    			transition_in(cross2.$$.fragment, local);
    			transition_in(cross3.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(cross0.$$.fragment, local);
    			transition_out(cross1.$$.fragment, local);
    			transition_out(cross2.$$.fragment, local);
    			transition_out(cross3.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div2);
    			destroy_component(cross0);
    			destroy_component(cross1);
    			destroy_component(cross2);
    			destroy_component(cross3);
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

    function instance$1($$self, $$props, $$invalidate) {
    	let y = 0;
    	let scrollSpeed = 12;
    	let viewportHeight;

    	function handleMouseMove(event) {
    		m.x = event.clientX;
    		m.y = event.clientY;
    		return m;
    	}

    	function onwindowscroll() {
    		$$invalidate(1, y = window.pageYOffset);
    	}

    	function onwindowresize() {
    		$$invalidate(2, viewportHeight = window.innerHeight);
    	}

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("y" in $$props) $$invalidate(1, y = $$props.y);
    		if ("scrollSpeed" in $$props) $$invalidate(4, scrollSpeed = $$props.scrollSpeed);
    		if ("viewportHeight" in $$props) $$invalidate(2, viewportHeight = $$props.viewportHeight);
    		if ("scrollPos" in $$props) $$invalidate(3, scrollPos = $$props.scrollPos);
    		if ("m" in $$props) m = $$props.m;
    	};

    	let scrollPos;
    	let m;

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*y*/ 2) {
    			//Rounded y scroll value
    			 $$invalidate(3, scrollPos = Math.round(y));
    		}
    	};

    	 m = { x: 0, y: 0 };

    	return [
    		handleMouseMove,
    		y,
    		viewportHeight,
    		scrollPos,
    		scrollSpeed,
    		m,
    		onwindowscroll,
    		onwindowresize
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { handleMouseMove: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get handleMouseMove() {
    		return this.$$.ctx[0];
    	}

    	set handleMouseMove(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
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
