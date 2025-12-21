/**
 * Roadmapper Embed SDK v1.0
 * Usage: <roadmap-portal workspace="..." roadmap="..." zoom="..."></roadmap-portal>
 */

class RoadmapPortal extends HTMLElement {
    constructor() {
        super();
        this.iframe = null;
    }

    static get observedAttributes() {
        return ['workspace', 'roadmap', 'zoom', 'theme'];
    }

    connectedCallback() {
        this.render();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            this.render();
        }
    }

    getParams() {
        return {
            workspace: this.getAttribute('workspace'),
            roadmap: this.getAttribute('roadmap'),
            zoom: this.getAttribute('zoom') || 'snapshot',
            theme: this.getAttribute('theme'),
        };
    }

    getHostStyles() {
        // capture important variables to pass down
        const style = getComputedStyle(this);
        return {
            fontFamily: style.getPropertyValue('--rm-font-family'),
            primary: style.getPropertyValue('--rm-primary'),
            bg: style.getPropertyValue('--rm-bg-surface'),
        };
    }

    render() {
        const { workspace, roadmap, zoom } = this.getParams();
        if (!workspace || !roadmap) return;

        if (!this.iframe) {
            const shadow = this.attachShadow({ mode: 'open' });
            this.iframe = document.createElement('iframe');
            this.iframe.style.width = '100%';
            this.iframe.style.height = '600px'; // default
            this.iframe.style.border = 'none';
            this.iframe.style.overflow = 'hidden';
            shadow.appendChild(this.iframe);
        }

        // In real app, this points to production URL
        // For local dev, we assume relative path or localhost
        const baseUrl = window.location.origin; // or config

        // Pass styles as params? Or handle via PostMessage later
        const src = `${baseUrl}/r/${workspace}/${roadmap}?zoom=${zoom}&embed=true`;

        if (this.iframe.src !== src) {
            this.iframe.src = src;
        }
    }
}

customElements.define('roadmap-portal', RoadmapPortal);
