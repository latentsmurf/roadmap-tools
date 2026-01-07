class RoadmapPortal extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: "open" })
  }

  async connectedCallback() {
    const slug = this.getAttribute("slug")
    const zoom = this.getAttribute("zoom") || "snapshot"
    const workspace = this.getAttribute("workspace") || "acme"

    const embedUrl = `https://www.roadmap.tools/r/${workspace}/${slug}?embed=true&zoom=${zoom}`

    this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    width: 100%;
                    height: 600px;
                    border-radius: 12px;
                    overflow: hidden;
                    border: 1px solid #e2e8f0;
                    background: #fff;
                }
                iframe {
                    width: 100%;
                    height: 100%;
                    border: none;
                }
            </style>
            <iframe src="${embedUrl}" title="Product Roadmap"></iframe>
        `
  }
}

customElements.define("roadmap-portal", RoadmapPortal)
