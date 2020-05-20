import {settings, settingsCookie, bdplugins, bdthemes, settingsRPC} from "../0globals";
import DataStore from "./dataStore";
import V2_SettingsPanel_Sidebar from "./settingsPanelSidebar";
import Utils from "./utils";
import BDV2 from "./v2";
import ContentManager from "./contentManager";
import BDEvents from "./bdEvents";
import coloredText from "./coloredText";
import tfHour from "./24hour";
import reactDevTools from "./reactDevTools";
import DOM from "./domtools";

import publicServersModule from "./publicServers";
import voiceMode from "./voiceMode";
import ClassNormalizer from "./classNormalizer";
import dMode from "./devMode";

import Tools from "../ui/tools";
import Scroller from "../ui/scroller";
import SectionedSettingsPanel from "../ui/sectionedSettingsPanel";
import SettingsPanel from "../ui/settingsPanel";
import CssEditor from "../ui/cssEditor";
import CardList from "../ui/addonlist";
import V2C_PresenceSettings from "../ui/presenceSettings";
import CustomRichPresence from "./CustomRichPresence";

export default new class V2_SettingsPanel {

    constructor() {
        this.sideBarOnClick = this.sideBarOnClick.bind(this);
        this.onChange = this.onChange.bind(this);
        this.updateSettings = this.updateSettings.bind(this);
        this.sidebar = new V2_SettingsPanel_Sidebar(this.sideBarOnClick);
        // this.buildPluginProps = this.buildPluginProps.bind(this);
        // this.buildThemeProps = this.buildThemeProps.bind(this);
        this.showOriginal = this.showOriginal.bind(this);
    }

    get root() {
        const _root = DOM.query("#bd-settingspane-container");
        if (!_root) {
            if (!this.injectRoot()) return null;
            return this.root;
        }
        return _root;
    }

    injectRoot() {
        let [
            classNameLayer,
            classSidebar
        ] = [
            BDModules.get(e => e.layer && e.animating)[0].layer.split(" ")[0],
            BDModules.get(e => e.standardSidebarView)[0]
        ]
        const sidebar = DOM.query("."+classNameLayer+" ."+classSidebar.standardSidebarView.split(" ")[0]+", ."+classNameLayer+" .ui-standard-sidebar-view");
        if (!sidebar) return false;
        const root = DOM.createElement(`<div id="bd-settingspane-container" class="${classSidebar.contentRegion} content-region">`);
        sidebar.append(root);

        Utils.onRemoved(root, () => {
            BDV2.reactDom.unmountComponentAtNode(root);
        });
        return true;
    }

    get coreSettings() {
        const settings = this.getSettings("core");
        const categories = [...new Set(settings.map(s => s.category))];
        const sections = categories.map(c => {return {title: c, settings: settings.filter(s => s.category == c)};});
        return sections;
    }

    get lightcordSettings() {
        const settings = this.getSettings("lightcord");
        const categories = [...new Set(settings.map(s => s.category))];
        const sections = categories.map(c => {return {title: c, settings: settings.filter(s => s.category == c)};});
        return sections;
    }

    get PresenceSettings() {
        return this.getSettings("status")
    }

    get MsgLogSettings() {
        return this.getSettings("msglog")
    }

    getSettings(category) {
        return Object.keys(settings).reduce((arr, key) => {
            const setting = settings[key];
            if (setting.cat === category && setting.implemented && !setting.hidden) {
                setting.text = key;
                arr.push(setting);
            }
            return arr;
        }, []);
    }

    sideBarOnClick(id) {
        const contentRegion = DOM.query(".contentRegion-3nDuYy, .content-region");
        contentRegion.style.display = "none";
        this.root.style.display = "";
        switch (id) {
            case "core":
                this.renderCoreSettings();
                break;
            case "customcss":
                this.renderCustomCssEditor();
                break;
            case "plugins":
            case "themes":
                this.renderAddonPane(id);
                break;
            case "lightcord":
                this.renderLightCordSettings()
                break
            case "status":
                this.renderPresenceSettings()
        }
    }

    onClick() {}

    onChange(id, checked) {
        this.updateSettings(id, checked);
    }

    updateSettings(id, enabled) {
        settingsCookie[id] = enabled;

        if (id == "bda-gs-2") {
            if (enabled) DOM.addClass(document.body, "bd-minimal");
            else DOM.removeClass(document.body, "bd-minimal");
        }

        if (id == "bda-gs-3") {
            if (enabled) DOM.addClass(document.body, "bd-minimal-chan");
            else DOM.removeClass(document.body, "bd-minimal-chan");
        }

        if (id == "bda-gs-1") {
            if (enabled) publicServersModule.addButton();
            else publicServersModule.removeButton();
        }

        if (id == "bda-gs-4") {
            if (enabled) voiceMode.start();
            else voiceMode.stop();
        }

        if (id == "bda-gs-5") {
            if (enabled) DOM.addClass(DOM.query("#app-mount"), "bda-dark");
            else DOM.removeClass(DOM.query("#app-mount"), "bda-dark");
        }

        if (enabled && id == "bda-gs-6") tfHour.inject24Hour();

        if (id == "bda-gs-7") {
            if (enabled) coloredText.injectColoredText();
            else coloredText.removeColoredText();
        }

        if (id == "fork-ps-4") {
            if (enabled) ClassNormalizer.start();
            else ClassNormalizer.stop();
        }

        if (id == "fork-ps-5") {
            if (enabled) {
                ContentManager.watchContent("plugin");
                ContentManager.watchContent("theme");
            }
            else {
                ContentManager.unwatchContent("plugin");
                ContentManager.unwatchContent("theme");
            }
        }

        if (id == "fork-wp-1") {
            Utils.setWindowPreference("transparent", enabled);
            if (enabled) Utils.setWindowPreference("backgroundColor", null);
            else Utils.setWindowPreference("backgroundColor", "#2f3136");
        }


        if (id == "bda-gs-8") {
            if (enabled) dMode.startDebugListener();
            else dMode.stopDebugListener();
        }

        if (id == "fork-dm-1") {
            if (enabled) dMode.startCopySelector();
            else dMode.stopCopySelector();
        }

        if (id === "reactDevTools") {
            if (enabled) reactDevTools.start();
            else reactDevTools.stop();
        }
        if (id === "lightcord-1") {
            if (enabled) window.lightcordSettings.devMode = true
            else window.lightcordSettings.devMode = false
        }
        if (id === "lightcord-2") {
            if (enabled) window.lightcordSettings.callRingingBeat = true
            else window.lightcordSettings.callRingingBeat = false
        }

        if (id === "lightcord-presence-1") {
            if (enabled) CustomRichPresence.enable()
            else CustomRichPresence.disable()
        }

        this.saveSettings();
    }

    async initializeSettings() {
        if (settingsCookie.reactDevTools) reactDevTools.start();
        if (settingsCookie["bda-gs-2"]) DOM.addClass(document.body, "bd-minimal");
        if (settingsCookie["bda-gs-3"]) DOM.addClass(document.body, "bd-minimal-chan");
        if (settingsCookie["bda-gs-1"]) publicServersModule.addButton();
        if (settingsCookie["bda-gs-4"]) voiceMode.start();
        if (settingsCookie["bda-gs-5"]) DOM.addClass(DOM.query("#app-mount"), "bda-dark");
        if (settingsCookie["bda-gs-6"]) tfHour.inject24Hour();
        if (settingsCookie["bda-gs-7"]) coloredText.injectColoredText();
        if (settingsCookie["fork-ps-4"]) ClassNormalizer.start();
        if (settingsCookie["lightcord-1"]) window.lightcordSettings.devMode = true
        if (settingsCookie["lightcord-2"]) window.lightcordSettings.callRingingBeat = true
        if (settingsCookie["lightcord-presence-1"]) CustomRichPresence.enable()

        if (settingsCookie["fork-ps-5"]) {
            ContentManager.watchContent("plugin");
            ContentManager.watchContent("theme");
        }

        if (settingsCookie["bda-gs-8"]) dMode.startDebugListener();
        if (settingsCookie["fork-dm-1"]) dMode.startCopySelector();

        this.saveSettings();
    }

    saveSettings() {
        DataStore.setSettingGroup("settings", settingsCookie);
        DataStore.setSettingGroup("rpc", settingsRPC);
    }

    loadSettings() {
        Object.assign(settingsCookie, DataStore.getSettingGroup("settings"));
        Object.assign(settingsRPC, DataStore.getSettingGroup("rpc"));
    }

    showOriginal() {
        BDV2.reactDom.unmountComponentAtNode(this.root);
        this.root.style.display = "none";
        DOM.query("."+BDModules.get(e => e.contentRegion)[0].contentRegion.split(" ")[0]+", .content-region").style.display = "";
    }

    renderSidebar() {
        const tabs = document.querySelectorAll("[class*='side-'] > [class*='item-']");
        for (const element of tabs) {
            element.removeEventListener("click", this.showOriginal);
            element.addEventListener("click", this.showOriginal);
        }
        this.sidebar.render();
    }

    get coreComponent() {
        return BDV2.react.createElement(Scroller, {contentColumn: true, fade: true, dark: true},
            BDV2.react.createElement(SectionedSettingsPanel, {key: "cspanel", onChange: this.onChange, sections: this.coreSettings}),
            BDV2.react.createElement(Tools, {key: "tools"})
        );
    }

    get lightcordComponent() {
        return BDV2.react.createElement(Scroller, {contentColumn: true, fade: true, dark: true},
            BDV2.react.createElement(SectionedSettingsPanel, {key: "lspannel", onChange: this.onChange, sections: this.lightcordSettings}),
            BDV2.react.createElement(Tools, {key: "tools"})
        );
    }

    get PresenceComponent() {
        return BDV2.react.createElement(Scroller, {contentColumn: true, fade: true, dark: true},
            BDV2.react.createElement(V2C_PresenceSettings, {
                key: "lspannel",
                onChange: this.onChange, 
                settings: this.PresenceSettings
            }),
            BDV2.react.createElement(Tools, {key: "tools"})
        );
    }

    get customCssComponent() {
        return BDV2.react.createElement(Scroller, {contentColumn: true, fade: true, dark: true},
            BDV2.react.createElement(CssEditor, {key: "csseditor"}),
            BDV2.react.createElement(Tools, {key: "tools"})
        );
    }

    renderCoreSettings() {
        const root = this.root;
        if (!root) return Utils.err("SettingsPanel", "FAILED TO LOCATE ROOT: .layer-3QrUeG .standardSidebarView-3F1I7i");
        BDV2.reactDom.render(this.coreComponent, root);
    }

    renderLightCordSettings() {
        const root = this.root;
        if (!root) return Utils.err("SettingsPanel", "FAILED TO LOCATE ROOT: .layer-3QrUeG .standardSidebarView-3F1I7i");
        BDV2.reactDom.render(this.lightcordComponent, root);
    }

    renderPresenceSettings() {
        const root = this.root;
        if (!root) return Utils.err("SettingsPanel", "FAILED TO LOCATE ROOT: .layer-3QrUeG .standardSidebarView-3F1I7i");
        BDV2.reactDom.render(this.PresenceComponent, root);
    }

    renderCustomCssEditor() {
        const root = this.root;
        if (!root) return Utils.err("SettingsPanel", "FAILED TO LOCATE ROOT: .layer-3QrUeG .standardSidebarView-3F1I7i");
        BDV2.reactDom.render(this.customCssComponent, root);
    }

    // renderAddonPane(type) {
    //     const root = this.root;
    //     if (!root) return Utils.err("SettingsPanel", "FAILED TO LOCATE ROOT: .layer-3QrUeG .standardSidebarView-3F1I7i");
    //     BDV2.reactDom.render(this.contentComponent(type), root);
    // }

    renderAddonPane(type) {
        if (!this.root) return Utils.err("SettingsPanel", "FAILED TO LOCATE ROOT: .layer-3QrUeG .standardSidebarView-3F1I7i");
        // I know this shouldn't be here, but when it isn't,
        // React refuses to change the button when going
        // between plugins and themes page... something
        // to debug later.
        class ContentList extends BDV2.react.Component {
            constructor(props) {
                super(props);
                this.prefix = this.props.type.replace("s", "");
                this.onChange = this.onChange.bind(this);
            }
        
            componentDidMount() {
                BDEvents.on(`${this.prefix}-reloaded`, this.onChange);
                BDEvents.on(`${this.prefix}-loaded`, this.onChange);
                BDEvents.on(`${this.prefix}-unloaded`, this.onChange);
            }
        
            componentWillUnmount() {
                BDEvents.off(`${this.prefix}-reloaded`, this.onChange);
                BDEvents.off(`${this.prefix}-loaded`, this.onChange);
                BDEvents.off(`${this.prefix}-unloaded`, this.onChange);
            }
        
            onChange() {
                this.props.onChange(this.props.type);
            }
        
            render() {return this.props.children;}
        }
        const list = type === "plugins" ? Object.values(bdplugins) : Object.values(bdthemes);
        return BDV2.reactDom.render(BDV2.react.createElement(ContentList, {type, onChange: this.sideBarOnClick}, BDV2.react.createElement(CardList, {type, list})), this.root);
    }
};
