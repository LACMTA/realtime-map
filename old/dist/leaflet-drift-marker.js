"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
if (typeof window.exports != "object") {
    //cdn usage on browsers without "exports" variable
    window.exports = {};
}
var Leaflet_module = window.L ? window.L : require("leaflet");
var DriftMarker = /** @class */ (function (_super) {
    __extends(DriftMarker, _super);
    function DriftMarker() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this._slideToUntil = 0;
        _this._slideToDuration = 1000;
        _this._slideToLatLng = [0, 0];
        _this._slideFromLatLng = [0, 0];
        _this._slideKeepAtCenter = false;
        _this._slideDraggingWasAllowed = false;
        _this._slideFrame = 0;
        _this.addInitHook = function () {
            _this.on("move", _this.slideCancel, _this);
        };
        // 🍂method slideTo(latlng: LatLng, options: Slide Options): this
        // Moves this marker until `latlng`, like `setLatLng()`, but with a smooth
        // sliding animation. Fires `movestart` and `moveend` events.
        _this.slideTo = function (latlng, options) {
            if (!_this._map)
                return;
            _this._slideToDuration = options.duration;
            _this._slideToUntil = performance.now() + options.duration;
            _this._slideFromLatLng = _this.getLatLng();
            _this._slideToLatLng = latlng;
            _this._slideKeepAtCenter = !!options.keepAtCenter;
            _this._slideDraggingWasAllowed =
                _this._slideDraggingWasAllowed !== undefined
                    ? _this._slideDraggingWasAllowed
                    : _this._map.dragging.enabled();
            if (_this._slideKeepAtCenter) {
                _this._map.dragging.disable();
                _this._map.doubleClickZoom.disable();
                _this._map.options.touchZoom = "center";
                _this._map.options.scrollWheelZoom = "center";
            }
            _this.fire("movestart");
            _this._slideTo();
            return _this;
        };
        _this._slideTo = function () {
            if (!_this._map)
                return;
            var remaining = _this._slideToUntil - performance.now();
            if (remaining < 0) {
                _this.setLatLng(_this._slideToLatLng);
                _this.fire("moveend");
                if (_this._slideDraggingWasAllowed) {
                    _this._map.dragging.enable();
                    _this._map.doubleClickZoom.enable();
                    _this._map.options.touchZoom = true;
                    _this._map.options.scrollWheelZoom = true;
                }
                _this._slideDraggingWasAllowed = false;
                return _this;
            }
            var startPoint = _this._map.latLngToContainerPoint(_this._slideFromLatLng);
            var endPoint = _this._map.latLngToContainerPoint(_this._slideToLatLng);
            var percentDone = (_this._slideToDuration - remaining) / _this._slideToDuration;
            var currPoint = endPoint
                .multiplyBy(percentDone)
                .add(startPoint.multiplyBy(1 - percentDone));
            var currLatLng = _this._map.containerPointToLatLng(currPoint);
            _this.setLatLng(currLatLng);
            if (_this._slideKeepAtCenter) {
                _this._map.panTo(currLatLng, { animate: false });
            }
            _this._slideFrame = Leaflet_module.Util.requestAnimFrame(_this._slideTo, _this);
        };
        return _this;
    }
    // 🍂method slideCancel(): this
    // Cancels the sliding animation from `slideTo`, if applicable.
    DriftMarker.prototype.slideCancel = function () {
        Leaflet_module.Util.cancelAnimFrame(this._slideFrame);
    };
    return DriftMarker;
}(Leaflet_module.Marker));
window.DriftMarker = DriftMarker;
exports.default = DriftMarker;
//# sourceMappingURL=index.js.map