import {Editor, MarkdownView, Plugin } from 'obsidian';

interface TalonCorrectorPluginSettings {
}

const DEFAULT_SETTINGS: TalonCorrectorPluginSettings = {
}


export default class TalonCorrectorPlugin extends Plugin {
	settings: TalonCorrectorPluginSettings;


	async onload() {
		await this.loadSettings();

		this.addCommand({
			id: 'correct-current-line',
			name: 'Ask an LLM to correct the current line',
			editorCallback: async (editor: Editor, activeView: MarkdownView) => {
				if (!activeView.file) {
					return
				}
				const currentLine=activeView.editor.getCursor().line
				const fileContents = await this.app.vault.read(activeView.file);
				return { currentLine, fileContents}

				editor.replaceSelection('Sample Editor Command');
			}
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		// this.addSettingTab(new SampleSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		// this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
		// 	console.log('click', evt);
		// });

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		// this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}




