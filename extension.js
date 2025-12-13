import Clutter from 'gi://Clutter';
import Gio from 'gi://Gio';
import GObject from 'gi://GObject';
import St from 'gi://St';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';

const BrightnessIndicator = GObject.registerClass(
class BrightnessIndicator extends St.BoxLayout {
    _init() {
        super._init({
            reactive: true,
            visible: true,
            style_class: 'panel-status-indicators-box',
        });

        const icon = new St.Icon({
            gicon: new Gio.ThemedIcon({name: 'display-brightness-symbolic'}),
            style_class: 'system-status-icon',
        });
        
        this._label = new St.Label({
            y_expand: true,
            y_align: Clutter.ActorAlign.CENTER,
        });

        this.add_child(icon);
        this.add_child(this._label);

        this._connectBrightness();
    }

    _connectBrightness() {
        if (!Main.brightnessManager?.globalScale) {
            this._label.text = 'N/A';
            return;
        }

        this._brightnessScale = Main.brightnessManager.globalScale;
        this._updateBrightness();
        
        this._signalId = this._brightnessScale.connect('notify::value', 
            () => this._updateBrightness()
        );
    }

    _updateBrightness() {
        const percent = Math.round(this._brightnessScale.value * 100);
        this._label.text = `${percent}%`;
    }

    destroy() {
        if (this._signalId) {
            this._brightnessScale.disconnect(this._signalId);
            this._signalId = null;
        }
        this._brightnessScale = null;
        super.destroy();
    }
});

export default class BrightnessExtension extends Extension {
    enable() {
        this._indicator = new BrightnessIndicator();
        
        const quickSettings = Main.panel.statusArea.quickSettings;
        if (quickSettings?._indicators) {
            quickSettings._indicators.add_child(this._indicator);
        } else {
            Main.panel._rightBox.insert_child_at_index(this._indicator, 0);
        }
    }

    disable() {
        this._indicator?.destroy();
        this._indicator = null;
    }
}
