import {Editor, MarkdownView, Plugin, PluginSettingTab } from 'obsidian';
import Groq from 'groq-sdk'

interface TalonCorrectorPluginSettings {
	groqApiKey: string
}

const DICTATED_LINE = 'DICTATED_LINE'

export const SYSTEM_INSTRUCTIONS = `I used a voice-to-text system to edit a single line in following document, which I have marked with ${DICTATED_LINE}.
Please provide a corrected version of the line, fixing the following issues:
1. Punctuation, spacing, and capitalization issues. Prefer periods to semicolons and avoid em dashes
2. Strange word choices that seem due to miscomprehension. This includes homophones like "sew" vs "so" and near-homophones like "can troll" vs "control."
3. Be especially mindful of phrases that might sound like unusual proper nouns or made up words used elsewhere in the document. For example, if the document is prose referring to someone named "Kai," but the dictation refers to "key" like a person, it probably misheard.

Please fix whatever issues you find, without explanation`


function injectTagIntoDocument(document:string, lineIndex: number): string {
	let lines = document.split('\n')
	lines[lineIndex] = `${DICTATED_LINE}: ${lines[lineIndex]}`
	return lines.join('\n')
}




export default class TalonCorrectorPlugin extends Plugin {
	settings: TalonCorrectorPluginSettings;
	groq: Groq

	async correctLine(document:string, lineIndex: number): Promise<string> {
		const chatCompletion = await this.groq.chat.completions.create({
			"messages": [
			{
				"role": "system",
				"content": SYSTEM_INSTRUCTIONS
			},
			{
				"role": "user",
				"content": injectTagIntoDocument(document, lineIndex),
			},
			],
			"model": "deepseek-r1-distill-llama-70b",
			"temperature": 0.6,
			"max_completion_tokens": 4096,
			"top_p": 0.95,
			"stream": false,
			"stop": null
		});
		return chatCompletion.choices[0].message.content 
	}


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
				const document = await this.app.vault.read(activeView.file);
				let correctionAttempt= await this.correctLine(document,currentLine)
				correctionAttempt = correctionAttempt.trim() + "\n"
				editor.replaceRange(correctionAttempt, { line: currentLine + 1, ch: 0 })
			}
		});

		this.addSettingTab(new SampleSettingTab(this.app, this));

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
		this.settings = await this.loadData();
		this.groq = new Groq({ apiKey: this.settings.groqApiKey})
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}


 
/*
class TalonCorrectorPluginSettingsTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Setting #1')
			.setDesc('It\'s a secret')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue(this.plugin.settings.mySetting)
				.onChange(async (value) => {
					this.plugin.settings.mySetting = value;
					await this.plugin.saveSettings();
				}));
	}
}
*/
