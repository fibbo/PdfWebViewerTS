import { CanvasLayer } from '../CanvasLayer'
import { ViewerCanvasState } from '../../pdf-viewer-canvas/state/store'
import { PdfItemType, Point, AnnotationBorderStyle, FreeTextAnnotationArgs, Rect, Annotation } from '../../pdf-viewer-api'
import { CursorStyle } from '../../pdf-viewer-canvas/state/viewer'
import { getPageOnPoint, getRectFromSelection } from '../../pdf-viewer-canvas/state/document'
import { FreetextAnnotationModule } from './FreetextAnnotationModule'
import { createAddFreetextAnnotationToolbar } from './AddFreetextAnnotationToolbar'

const moduleLayerName = 'AddFreetextAnnotation'

export class AddFreetextAnnotationLayer extends CanvasLayer {

  private context: CanvasRenderingContext2D | null = null

  private colors: string[] = []
  private selectedColor: string = ''
  private pointerDown: boolean = false
  private startPoint: Point | null = null
  private page: number = 0

  public onCreate(): void {

    this.setColor = this.setColor.bind(this)
    this.close = this.close.bind(this)

    this.context = this.createCanvas()
    this.colors = this.options.backgroundColors
    this.selectedColor = this.options.defaultFreetextBgColor ?
                         this.options.defaultFreetextBgColor :
                         this.options.defaultBackgroundColor

    /* tslint:disable-next-line:align */
    ; const toolbarElement = (this.module as FreetextAnnotationModule).toolbarElement as HTMLElement

    createAddFreetextAnnotationToolbar({
      colors: this.colors,
      selectedColor: this.selectedColor,
      onColorChanged: this.setColor,
      onClose: this.close,
    }, toolbarElement)

    this.store.viewer.beginModule(moduleLayerName)
  }

  public onRemove(): void {
    this.removeCanvasElements()
    this.context = null

    /* tslint:disable-next-line:align */
    ; const toolbarElement = (this.module as FreetextAnnotationModule).toolbarElement as HTMLElement
    toolbarElement.innerHTML = ''

    this.store.viewer.setCursorStyle(CursorStyle.DEFAULT)
    this.store.viewer.endModule(moduleLayerName)
  }

  public render(timestamp: number, state: ViewerCanvasState): void {

    if (state.viewer.modeChanged && state.viewer.selectedModuleName !== moduleLayerName) {
      this.remove()
      return
    }

    if (this.context) {
      const update = state.viewer.modeChanged ||
        state.pointer.positionChanged ||
        state.pointer.action ||
        state.document.zoomChanged

      if (update) {
        const ctx = this.context
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)

        const pointerPos = { x: state.pointer.x.devicePixels, y: state.pointer.y.devicePixels }
        const page = getPageOnPoint(state.document, pointerPos)
        const pointerOnPage = page > 0

        if (pointerOnPage) {
          this.store.viewer.setCursorStyle(CursorStyle.CROSSHAIR)
        } else {
          this.store.viewer.setCursorStyle(CursorStyle.NOT_ALLOWED)
        }

        if (state.pointer.isDown) {

          if (!this.pointerDown) {
            this.startPoint = pointerPos
            this.pointerDown = true

            if (this.page === 0 && page !== 0) {
              this.page = page
            }
          }

          if (this.startPoint) {
            const rect = getRectFromSelection(state.document, {
              x: this.startPoint.x,
              y: this.startPoint.y,
            }, {
              x: pointerPos.x,
              y: pointerPos.y,
            }, this.page)

            if (rect) {
              const lineWidth = 2 * devicePixelRatio
              ctx.save()
              ctx.strokeStyle = this.options.textSelectionColor
              ctx.fillStyle = this.options.textSelectionColor
              ctx.lineWidth = lineWidth
              ctx.setLineDash([lineWidth, lineWidth])
              ctx.strokeRect(rect.x, rect.y, rect.w, rect.h)
              ctx.globalAlpha = .33
              ctx.fillRect(rect.x, rect.y, rect.w, rect.h)
              ctx.restore()
            }
          }

        } else if (this.pointerDown && this.startPoint) {

          const rect = getRectFromSelection(state.document, {
            x: this.startPoint.x,
            y: this.startPoint.y,
          }, {
            x: pointerPos.x,
            y: pointerPos.y,
          }, this.page)

          if (rect) {
            this.createFreeTextAnnotation(rect)
            this.pointerDown = false
            this.startPoint = null
            this.remove()
          }
        }
      }
    }
  }

  private setColor(color: string) {
    this.selectedColor = color
  }

  private close() {
    this.remove()
  }

  private createFreeTextAnnotation(rect: Rect) {
    const pdfRect = this.pdfApi.transformScreenRectToPdfRect(rect, this.page)
    const annotation: FreeTextAnnotationArgs = {
      itemType: PdfItemType.FREE_TEXT,
      color: this.selectedColor,
      originalAuthor: this.options.author,
      page: pdfRect.page,
      pdfRect,
      border: {
        width: this.options.defaultFreetextBorderSize ?
               this.options.defaultFreetextBorderSize :
               this.options.defaultBorderSize,
        style: AnnotationBorderStyle.SOLID,
      },
      /* tslint:disable-next-line: max-line-length */
      richtext: `<?xml version="1.0"?><body xmlns="http://www.w3.org/1999/xhtml" xmlns:xfa="http://www.xfa.org/schema/xfa-data/1.0/" xfa:APIVersion="Acrobat:19.12.0" xfa:spec="2.0.2" style="color:${this.options.defaultFreetextFontColor ? this.options.defaultFreetextFontColor : this.options.defaultForegroundColor};"></body>`,
      fontName: 'Arial',
      fontColor: this.options.defaultFreetextFontColor ?
                 this.options.defaultFreetextFontColor :
                 this.options.defaultForegroundColor,
      fontSize: this.options.defaultFreetextFontSize ?
                this.options.defaultFreetextFontSize :
                this.options.defaultFontSize,
    }
    this.pdfApi.createItem(annotation).then(item => {
      /* tslint:disable-next-line:align */
      (this.module as FreetextAnnotationModule).onEdit(item.id)
    })
  }

}
