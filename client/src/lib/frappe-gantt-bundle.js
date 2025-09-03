// Frappe Gantt Bundle - Direct implementation from gantt-master source

// Date utilities
const date_utils = {
    parse(date, date_separator = '-', time_separator = /[.:]/) {
        if (date instanceof Date) {
            return date;
        }
        if (typeof date === 'string') {
            let date_parts, time_parts;
            const parts = date.split(' ');

            date_parts = parts[0]
                .split(date_separator)
                .map((val) => parseInt(val, 10));
            time_parts = parts[1] && parts[1].split(time_separator);

            // month is 0 indexed
            date_parts[1] = date_parts[1] - 1;

            let vals = date_parts;

            if (time_parts && time_parts.length) {
                if (time_parts.length == 4) {
                    time_parts[3] = '0.' + time_parts[3];
                    time_parts[3] = parseFloat(time_parts[3]) * 1000;
                }
                vals = vals.concat(time_parts);
            }
            return new Date(...vals);
        }
    },

    to_string(date, with_time = false) {
        if (!(date instanceof Date)) {
            throw new TypeError('Invalid argument type');
        }
        const vals = this.get_date_values(date).map((val, i) => {
            if (i === 1) {
                // add 1 for month
                val = val + 1;
            }

            if (i === 0) {
                return val;
            }

            return val.toString().padStart(2, '0');
        });
        const date_string = `${vals[0]}-${vals[1]}-${vals[2]}`;
        const time_string = `${vals[3]}:${vals[4]}:${vals[5]}`;

        return date_string + (with_time ? ' ' + time_string : '');
    },

    format(date, format_string = 'YYYY-MM-DD HH:mm:ss', lang = 'en') {
        const values = this.get_date_values(date).map(d => d.toString().padStart(2, '0'));
        const format_map = {
            YYYY: values[0],
            MM: values[1],
            DD: values[2],
            HH: values[3],
            mm: values[4],
            ss: values[5],
        };

        let str = format_string;
        const formatted_values = [];

        Object.keys(format_map)
            .sort((a, b) => b.length - a.length) // big string first
            .forEach((key) => {
                if (str.includes(key)) {
                    str = str.replace(key, `$${formatted_values.length}`);
                    formatted_values.push(format_map[key]);
                }
            });

        formatted_values.forEach((value, i) => {
            str = str.replace(`$${i}`, value);
        });

        return str;
    },

    diff(date_a, date_b, scale = 'day') {
        let milliseconds, seconds, hours, minutes, days, months, years;

        milliseconds = date_a - date_b;
        seconds = milliseconds / 1000;
        minutes = seconds / 60;
        hours = minutes / 60;
        days = hours / 24;
        months = days / 30;
        years = months / 12;

        if (!scale.endsWith('s')) {
            scale += 's';
        }

        return Math.floor(
            {
                milliseconds,
                seconds,
                minutes,
                hours,
                days,
                months,
                years,
            }[scale],
        );
    },

    today() {
        const vals = this.get_date_values(new Date()).slice(0, 3);
        return new Date(...vals);
    },

    now() {
        return new Date();
    },

    add(date, qty, scale) {
        qty = parseInt(qty, 10);
        const vals = [
            date.getFullYear() + (scale === 'year' ? qty : 0),
            date.getMonth() + (scale === 'month' ? qty : 0),
            date.getDate() + (scale === 'day' ? qty : 0),
            date.getHours() + (scale === 'hour' ? qty : 0),
            date.getMinutes() + (scale === 'minute' ? qty : 0),
            date.getSeconds() + (scale === 'second' ? qty : 0),
            date.getMilliseconds() + (scale === 'millisecond' ? qty : 0),
        ];
        return new Date(...vals);
    },

    start_of(date, scale) {
        const scores = {
            year: 6,
            month: 5,
            day: 4,
            hour: 3,
            minute: 2,
            second: 1,
            millisecond: 0,
        };

        function should_reset(_scale) {
            const max_score = scores[scale];
            const score = scores[_scale];
            return score <= max_score;
        }

        const vals = [
            date.getFullYear(),
            should_reset('year') ? 0 : date.getMonth(),
            should_reset('month') ? 1 : date.getDate(),
            should_reset('day') ? 0 : date.getHours(),
            should_reset('hour') ? 0 : date.getMinutes(),
            should_reset('minute') ? 0 : date.getSeconds(),
            should_reset('second') ? 0 : date.getMilliseconds(),
        ];
        return new Date(...vals);
    },

    clone(date) {
        return new Date(...this.get_date_values(date));
    },

    get_date_values(date) {
        return [
            date.getFullYear(),
            date.getMonth(),
            date.getDate(),
            date.getHours(),
            date.getMinutes(),
            date.getSeconds(),
            date.getMilliseconds(),
        ];
    },

    get_days_in_month(date) {
        const no_of_days = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

        const month = date.getMonth();

        if (month !== 1) {
            return no_of_days[month];
        }

        // Feb
        const year = date.getFullYear();
        if ((year % 4 == 0 && year % 100 != 0) || year % 400 == 0) {
            return 29;
        }
        return 28;
    },
};

// SVG utilities
function $(expr, con) {
    return typeof expr === 'string' 
        ? (con || document).querySelector(expr) 
        : expr || null;
}

function createSVG(tag, attrs) {
    const elem = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (let attr in attrs) {
        if (attr === 'append_to') {
            const parent = attrs.append_to;
            parent.appendChild(elem);
        } else if (attr === 'innerHTML') {
            elem.innerHTML = attrs.innerHTML;
        } else {
            elem.setAttribute(attr, attrs[attr]);
        }
    }
    return elem;
}

// Default options
const DEFAULT_OPTIONS = {
    header_height: 50,
    column_width: 30,
    step: 24,
    view_modes: ['Quarter Day', 'Half Day', 'Day', 'Week', 'Month', 'Year'],
    bar_height: 20,
    bar_corner_radius: 3,
    arrow_curve: 5,
    padding: 18,
    view_mode: 'Day',
    date_format: 'YYYY-MM-DD',
    popup_trigger: 'click',
    custom_popup_html: null,
    language: 'en',
};

// Simple Gantt implementation
class SimpleGantt {
    constructor(wrapper, tasks, options) {
        this.setup_wrapper(wrapper);
        this.setup_options(options);
        this.setup_tasks(tasks);
        this.render();
    }

    setup_wrapper(element) {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }
        
        this.$wrapper = element;
        this.$wrapper.classList.add('gantt-container');
        
        // Clear existing content
        this.$wrapper.innerHTML = '';
        
        // Create SVG
        this.$svg = createSVG('svg', {
            append_to: this.$wrapper,
            class: 'gantt',
        });
    }

    setup_options(options) {
        this.options = Object.assign({}, DEFAULT_OPTIONS, options);
    }

    setup_tasks(tasks) {
        this.tasks = tasks.map((task, i) => {
            // Convert date strings to Date objects
            task._start = date_utils.parse(task.start);
            task._end = date_utils.parse(task.end);
            task._index = i;
            
            // Ensure minimum task duration
            if (date_utils.diff(task._end, task._start, 'hour') < 24) {
                task._end = date_utils.add(task._start, 24, 'hour');
            }
            
            return task;
        });
        
        this.setup_gantt_dates();
    }

    setup_gantt_dates() {
        this.setup_date_values();
        this.setup_dates();
    }

    setup_date_values() {
        const dates = this.tasks.map(d => d._start).concat(this.tasks.map(d => d._end));
        this.gantt_start = date_utils.start_of(dates.reduce((min, d) => d < min ? d : min), 'day');
        this.gantt_end = date_utils.start_of(dates.reduce((max, d) => d > max ? d : max), 'day');
        
        // Add padding
        this.gantt_start = date_utils.add(this.gantt_start, -7, 'day');
        this.gantt_end = date_utils.add(this.gantt_end, 7, 'day');
    }

    setup_dates() {
        this.dates = [];
        let cur_date = null;

        while (cur_date === null || cur_date < this.gantt_end) {
            if (!cur_date) {
                cur_date = date_utils.clone(this.gantt_start);
            } else {
                cur_date = date_utils.add(cur_date, 1, 'day');
            }
            this.dates.push(cur_date);
        }
    }

    render() {
        this.clear();
        this.setup_layers();
        this.make_grid();
        this.make_dates();
        this.make_bars();
        this.make_arrows();
        this.bind_grid_click();
    }

    clear() {
        this.$svg.innerHTML = '';
    }

    setup_layers() {
        this.layers = {};
        const layers = ['grid', 'date', 'arrow', 'progress', 'bar', 'details'];
        
        for (let layer of layers) {
            this.layers[layer] = createSVG('g', {
                class: layer,
                append_to: this.$svg,
            });
        }
    }

    make_grid() {
        this.make_grid_background();
        this.make_grid_rows();
        this.make_grid_header();
        this.make_grid_ticks();
        this.make_grid_highlights();
    }

    make_grid_background() {
        const grid_width = this.dates.length * this.options.column_width;
        const grid_height = this.options.header_height + this.options.padding + 
                           (this.tasks.length + 1) * (this.options.bar_height + this.options.padding);

        createSVG('rect', {
            x: 0,
            y: 0,
            width: grid_width,
            height: grid_height,
            class: 'grid-background',
            append_to: this.layers.grid,
        });

        this.$svg.setAttribute('height', grid_height);
        this.$svg.setAttribute('width', grid_width);
    }

    make_grid_rows() {
        const rows_layer = createSVG('g', { append_to: this.layers.grid });
        const lines_layer = createSVG('g', { append_to: this.layers.grid });

        const row_width = this.dates.length * this.options.column_width;
        const row_height = this.options.bar_height + this.options.padding;

        let row_y = this.options.header_height + this.options.padding / 2;

        for (let task of this.tasks) {
            createSVG('rect', {
                x: 0,
                y: row_y,
                width: row_width,
                height: row_height,
                class: 'grid-row',
                append_to: rows_layer,
            });

            createSVG('line', {
                x1: 0,
                y1: row_y + row_height,
                x2: row_width,
                y2: row_y + row_height,
                class: 'row-line',
                append_to: lines_layer,
            });

            row_y += row_height;
        }
    }

    make_grid_header() {
        const header_width = this.dates.length * this.options.column_width;
        const header_height = this.options.header_height;

        createSVG('rect', {
            x: 0,
            y: 0,
            width: header_width,
            height: header_height,
            class: 'grid-header',
            append_to: this.layers.grid,
        });
    }

    make_grid_ticks() {
        let tick_x = 0;
        let tick_y = this.options.header_height + this.options.padding / 2;
        let tick_height = (this.tasks.length + 1) * (this.options.bar_height + this.options.padding);

        for (let date of this.dates) {
            let tick_class = 'tick';
            // Major tick for weeks
            if (date.getDate() === 1) {
                tick_class += ' thick';
            }

            createSVG('path', {
                d: `M ${tick_x} ${tick_y} v ${tick_height}`,
                class: tick_class,
                append_to: this.layers.grid,
            });

            // Today line
            if (date_utils.diff(date, date_utils.today(), 'day') === 0) {
                createSVG('path', {
                    d: `M ${tick_x} ${tick_y} v ${tick_height}`,
                    class: 'today',
                    append_to: this.layers.grid,
                });
            }

            tick_x += this.options.column_width;
        }
    }

    make_grid_highlights() {
        // Weekend highlights, holidays, etc. can be added here
    }

    make_dates() {
        for (let i = 0; i < this.dates.length; i++) {
            const date = this.dates[i];
            const x = i * this.options.column_width + this.options.column_width / 2;

            createSVG('text', {
                x: x,
                y: this.options.header_height / 2,
                innerHTML: date.getDate(),
                class: 'lower-text',
                append_to: this.layers.date,
            });

            if (date.getDate() === 1) {
                createSVG('text', {
                    x: x,
                    y: this.options.header_height / 4,
                    innerHTML: date.toLocaleDateString('sv-SE', { month: 'short' }),
                    class: 'upper-text',
                    append_to: this.layers.date,
                });
            }
        }
    }

    make_bars() {
        this.bars = this.tasks.map((task) => {
            return this.make_bar(task);
        });
    }

    make_bar(task) {
        const x = this.get_x(task._start) + this.options.padding;
        const y = this.get_y(task._index) + this.options.padding;
        const width = this.get_x(task._end) - this.get_x(task._start) - this.options.padding;
        const height = this.options.bar_height;

        const bar_wrapper = createSVG('g', {
            class: 'bar-wrapper ' + (task.custom_class || ''),
            'data-task-id': task.id,
            append_to: this.layers.bar,
        });

        const bar = createSVG('rect', {
            x: x,
            y: y,
            width: width,
            height: height,
            rx: this.options.bar_corner_radius,
            ry: this.options.bar_corner_radius,
            class: 'bar',
            append_to: bar_wrapper,
        });

        // Progress bar
        if (task.progress) {
            const progress_width = (width * task.progress) / 100;
            createSVG('rect', {
                x: x,
                y: y,
                width: progress_width,
                height: height,
                rx: this.options.bar_corner_radius,
                ry: this.options.bar_corner_radius,
                class: 'bar-progress',
                append_to: bar_wrapper,
            });
        }

        // Label
        createSVG('text', {
            x: x + width / 2,
            y: y + height / 2,
            innerHTML: task.name,
            class: 'bar-label',
            append_to: bar_wrapper,
        });

        // Click handler
        bar_wrapper.addEventListener('click', () => {
            if (this.options.on_click) {
                this.options.on_click(task);
            }
        });

        return bar_wrapper;
    }

    make_arrows() {
        this.arrows = [];
        for (let task of this.tasks) {
            let arrows = [];
            arrows = this.get_arrows(task);
            this.arrows = this.arrows.concat(arrows);
        }
    }

    get_arrows(task) {
        let arrows = [];
        let from_task, to_task;

        if (task.dependencies) {
            const deps = task.dependencies.split(',').map(d => d.trim());
            for (let dep of deps) {
                from_task = this.get_task(dep);
                if (from_task) {
                    arrows.push(this.make_arrow(from_task, task));
                }
            }
        }
        return arrows;
    }

    make_arrow(from_task, to_task) {
        const start_x = this.get_x(from_task._end) + this.options.padding;
        const start_y = this.get_y(from_task._index) + this.options.padding + this.options.bar_height / 2;
        const end_x = this.get_x(to_task._start);
        const end_y = this.get_y(to_task._index) + this.options.padding + this.options.bar_height / 2;

        const path = `M ${start_x} ${start_y} L ${end_x} ${end_y}`;

        const arrow = createSVG('path', {
            d: path,
            class: 'arrow',
            append_to: this.layers.arrow,
        });

        return arrow;
    }

    bind_grid_click() {
        // Add any grid click handlers here
    }

    get_task(id) {
        return this.tasks.find(task => task.id === id);
    }

    get_x(date) {
        const diff = date_utils.diff(date, this.gantt_start, 'hour');
        let x = (diff / 24) * this.options.column_width;
        return x;
    }

    get_y(index) {
        return this.options.header_height + this.options.padding / 2 + 
               index * (this.options.bar_height + this.options.padding);
    }
}

// Export for use
window.FrappeGantt = SimpleGantt;
export default SimpleGantt;