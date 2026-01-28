// =============================================
// AMAZEING - Input Handler
// =============================================

/**
 * InputHandler - Manages touch and mouse input for path drawing
 */
export class InputHandler {
    /**
     * Create input handler
     * @param {HTMLElement} gridContainer - The grid container element
     * @param {Object} callbacks - Callback functions
     * @param {Function} callbacks.onDragStart - Called when drag starts
     * @param {Function} callbacks.onDragMove - Called during drag
     * @param {Function} callbacks.onDragEnd - Called when drag ends
     */
    constructor(gridContainer, callbacks) {
        this.container = gridContainer;
        this.callbacks = callbacks;
        this.isActive = false;
        this.lastCell = null;
        this.enabled = true;

        this._boundHandleStart = this._handleStart.bind(this);
        this._boundHandleMove = this._handleMove.bind(this);
        this._boundHandleEnd = this._handleEnd.bind(this);

        this._bindEvents();
    }

    /**
     * Bind event listeners
     */
    _bindEvents() {
        // Mouse events
        this.container.addEventListener('mousedown', this._boundHandleStart);
        document.addEventListener('mousemove', this._boundHandleMove);
        document.addEventListener('mouseup', this._boundHandleEnd);

        // Touch events
        this.container.addEventListener('touchstart', this._boundHandleStart, { passive: false });
        document.addEventListener('touchmove', this._boundHandleMove, { passive: false });
        document.addEventListener('touchend', this._boundHandleEnd);
        document.addEventListener('touchcancel', this._boundHandleEnd);

        // Prevent context menu on long press
        this.container.addEventListener('contextmenu', e => e.preventDefault());
    }

    /**
     * Handle start of drag (mousedown/touchstart)
     * @param {Event} e
     */
    _handleStart(e) {
        if (!this.enabled) return;

        e.preventDefault();

        const cell = this._getCellFromEvent(e);
        if (!cell) return;

        this.isActive = true;
        this.lastCell = cell;

        this.callbacks.onDragStart?.(cell.row, cell.col, cell.element);
    }

    /**
     * Handle drag movement (mousemove/touchmove)
     * @param {Event} e
     */
    _handleMove(e) {
        if (!this.isActive || !this.enabled) return;

        e.preventDefault();

        const cell = this._getCellFromEvent(e);
        if (!cell) return;

        // Only trigger if moved to a new cell
        if (this.lastCell &&
            cell.row === this.lastCell.row &&
            cell.col === this.lastCell.col) {
            return;
        }

        this.lastCell = cell;
        this.callbacks.onDragMove?.(cell.row, cell.col, cell.element);
    }

    /**
     * Handle end of drag (mouseup/touchend)
     * @param {Event} e
     */
    _handleEnd(e) {
        if (!this.isActive) return;

        this.isActive = false;
        const lastCell = this.lastCell;
        this.lastCell = null;

        this.callbacks.onDragEnd?.(lastCell?.row, lastCell?.col);
    }

    /**
     * Get cell position from event
     * @param {Event} e
     * @returns {{row: number, col: number, element: HTMLElement}|null}
     */
    _getCellFromEvent(e) {
        let clientX, clientY;

        // Handle touch events
        if (e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else if (e.changedTouches && e.changedTouches.length > 0) {
            clientX = e.changedTouches[0].clientX;
            clientY = e.changedTouches[0].clientY;
        } else {
            // Mouse event
            clientX = e.clientX;
            clientY = e.clientY;
        }

        // Find element at position
        const element = document.elementFromPoint(clientX, clientY);

        if (!element) return null;

        // Check if it's a cell
        if (element.classList.contains('cell')) {
            return {
                row: parseInt(element.dataset.row, 10),
                col: parseInt(element.dataset.col, 10),
                element
            };
        }

        // Check if it's a point (which is over a cell)
        if (element.classList.contains('point')) {
            // Find the cell at the same position
            const row = parseInt(element.dataset.row, 10);
            const col = parseInt(element.dataset.col, 10);
            const cellElement = this.container.querySelector(
                `.cell[data-row="${row}"][data-col="${col}"]`
            );
            return { row, col, element: cellElement };
        }

        return null;
    }

    /**
     * Enable input handling
     */
    enable() {
        this.enabled = true;
    }

    /**
     * Disable input handling
     */
    disable() {
        this.enabled = false;
        this.isActive = false;
        this.lastCell = null;
    }

    /**
     * Clean up event listeners
     */
    destroy() {
        this.container.removeEventListener('mousedown', this._boundHandleStart);
        document.removeEventListener('mousemove', this._boundHandleMove);
        document.removeEventListener('mouseup', this._boundHandleEnd);

        this.container.removeEventListener('touchstart', this._boundHandleStart);
        document.removeEventListener('touchmove', this._boundHandleMove);
        document.removeEventListener('touchend', this._boundHandleEnd);
        document.removeEventListener('touchcancel', this._boundHandleEnd);
    }
}
