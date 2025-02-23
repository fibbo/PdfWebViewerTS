import { ViewerCanvasState, ViewerCanvasStore } from '../pdf-viewer-canvas/state/store'
import { PdfViewerApi } from '../pdf-viewer-api'
import { PdfViewerCanvasOptions } from '../pdf-viewer-canvas/PdfViewerCanvasOptions'
import { CanvasModule } from './CanvasModule'

export interface CanvasLayerClass {
  new(module: CanvasModule, name: string, containerElement: HTMLElement, store: ViewerCanvasStore,
      pdfApi: PdfViewerApi, options: PdfViewerCanvasOptions): CanvasLayer
}

export abstract class CanvasLayer {

  protected containerElement: HTMLElement
  protected store: ViewerCanvasStore
  protected pdfApi: PdfViewerApi
  protected options: PdfViewerCanvasOptions
  protected module: CanvasModule
  private canvasContexts: CanvasRenderingContext2D[] = []
  private htmlLayers: HTMLElement[] = []
  private name: string

  constructor(module: CanvasModule, name: string, containerElement: HTMLElement,
              store: ViewerCanvasStore, pdfApi: PdfViewerApi, options: PdfViewerCanvasOptions) {
    this.containerElement = containerElement
    this.store = store
    this.pdfApi = pdfApi
    this.options = options
    this.module = module
    this.name = name

    this.remove = this.remove.bind(this)
  }

  public abstract onCreate(args?: any): void
  public abstract onRemove(): void
  public abstract render(timestamp: number, state: ViewerCanvasState): void

  public resize(width: number, height: number): void {

    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = width * devicePixelRatio
    tempCanvas.height = height * devicePixelRatio
    const tempContext = tempCanvas.getContext('2d') as CanvasRenderingContext2D

    this.canvasContexts.forEach(ctx => {
      tempContext.drawImage(ctx.canvas, 0, 0)
      ctx.canvas.style.width = width + 'px'
      ctx.canvas.style.height = height + 'px'
      ctx.canvas.width = width * devicePixelRatio
      ctx.canvas.height = height * devicePixelRatio
      ctx.drawImage(tempContext.canvas, 0, 0)
    })
  }

  protected remove() {
    this.module.removeCanvasLayer(this.name)
  }

  protected createHtmlLayer() {
    const element = document.createElement('div')
    this.htmlLayers.push(element)
    if (this.containerElement) {
      this.containerElement.appendChild(element)
    }
    return element
  }

  protected createCanvas() {
    const element = document.createElement('canvas')
    element.style.position = 'absolute'
    element.style.top = '0'
    element.style.left = '0'
    element.style.right = '0'
    element.style.bottom = '0'

    const context = element.getContext('2d') as CanvasRenderingContext2D
    this.canvasContexts.push(context)
    if (this.containerElement) {
      this.containerElement.appendChild(element)
      const rect = this.containerElement.getBoundingClientRect()
      context.canvas.width = rect.width * devicePixelRatio
      context.canvas.height = rect.height * devicePixelRatio
      context.canvas.style.width = rect.width + 'px'
      context.canvas.style.height = rect.height + 'px'
    }
    return context
  }

  protected removeHtmlElements() {
    if (this.containerElement) {
      for (let i = 0; i < this.htmlLayers.length; i++) {
        this.containerElement.removeChild(this.htmlLayers[i])
      }
      this.htmlLayers = []
    }
  }

  protected removeCanvasElements() {
    if (this.containerElement) {
      for (let i = 0; i < this.canvasContexts.length; i++) {
        this.containerElement.removeChild(this.canvasContexts[i].canvas)
      }
      this.canvasContexts = []
    }
  }
}
