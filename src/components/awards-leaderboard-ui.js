// Copyright 2020 D2L Corporation
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import '@brightspace-ui/core/components/colors/colors.js';
import '@brightspace-ui/core/components/dialog/dialog.js';
import '@brightspace-ui/core/components/icons/icon.js';
import '@brightspace-ui/core/components/list/list.js';
import '@brightspace-ui/core/components/list/list-item.js';
import 'd2l-users/components/d2l-profile-image.js';
import './leaderboard-row.js';

import { css, html, LitElement } from 'lit-element/lit-element.js';
import { BaseMixin } from '../mixins/base-mixin.js';

import { LeaderboardService } from '../services/awards-leaderboard-service.js';

class App extends BaseMixin(LitElement) {

	static get styles() {
		return [

			css`
			.myAwardItem {
				background-color: var(--d2l-color-celestine-plus-2);
			}
			@keyframes loadingPulse {
				0% { background-color: var(--d2l-color-sylvite); }
				50% { background-color: var(--d2l-color-regolith); }
				75% { background-color: var(--d2l-color-sylvite); }
				100% { background-color: var(--d2l-color-sylvite); }
			}
			.skeleton-awardRow{
				display: flex;
				flex-direction: row;
				align-items: center;
				padding: 3px;
			}
			.skeleton-awardRank{
				animation: loadingPulse 1.8s linear infinite;
				border-radius: 15px;
				height: 21px;
				width: 21px;
				padding: 9px;
				margin: 9px;
				-moz-border-radius:50%;
				-webkit-border-radius:50%;
			}
			.skeleton-profilePic {
				animation: loadingPulse 1.8s linear infinite;
				border-radius: 6px;
				width: 42px;
				height: 42px;
				margin-left: 7px;
			}
			.skeleton-info{
				display: flex;
				flex-direction: column;
				width: 50%;
				padding-left: 10px;
			}
			.skeleton-name {
				animation: loadingPulse 1.8s linear infinite;
				height: 0.8rem;
				width: 60%;
				border-radius: 6px;
			}
			.skeleton-count {
				animation: loadingPulse 1.8s linear infinite;
				height: 0.7rem;
				width: 40%;
				margin-top: 4px;
				border-radius: 4px;
			}
        `];
	}

	static get properties() {
		return {
			label: { type: String },
			orgUnitId: { type: Number },
			userId: { type: Number },
			sortByCreditsConfig: { type: Boolean },
			doneLoading: { type: Boolean },
			awardsDialogOpen: { type: Boolean },
			dialogAwardTitle: { type: String },
			dialogIssuedId: { type: Number }
		};
	}

	constructor() {
		super();
		this.label = '';
		this.orgUnitId = 0;
		this.userId = 0;
		this.sortedLeaderboardArray = [];
		this.myAwards = {};
		this.sortByCreditsConfig = false;
		this.doneLoading = false;
		this.awardsDialogOpen = false;
	}

	render() {
		if(!this.doneLoading){
			const numberOfItems = 5;
			const itemsSkeleton = html`
				<d2l-list-item>
					<d2l-list-item-content>
				<div class="skeleton-awardRow">
					<div class="skeleton-awardRank"></div>
					<div class="skeleton-profilePic"></div>
					<div class="skeleton-info">
						<div class="skeleton-name"></div>
						<div class="skeleton-count"></div>
					</div>
				</div>
					
					</d2l-list-item-content>
				</d2l-list-item>
			`;
			return html`<d2l-list>${(new Array(numberOfItems)).fill(itemsSkeleton)}</d2l-list>`;
		}
		return html`
			<d2l-dialog title-text="${this.dialogAwardTitle}" ?opened="${this.awardsDialogOpen}" @d2l-dialog-close="${this._closeDialog}">
				${this._renderDialogContents()}
				<d2l-button slot="footer" dialog-action>Close</d2l-button>
			</d2l-dialog>
			<d2l-list>
				${this._createLeaderboardEntry(this.myAwards, true)}
				${this.sortedLeaderboardArray.map(item => this._createLeaderboardEntry(item, false))}
			</d2l-list>
		`;
	}

	_renderDialogContents() {
		if (!this.awardsDialogOpen) {
			return;
		}
		return html`
			<iframe frameBorder="0" width="100%" height="100%" scrolling="no"
				src="${LeaderboardService.getIssuedAward(this.dialogIssuedId)}">
			</iframe>
		`;
	}

	firstUpdated() {
		this._getLeaderboard();
		this._getMyAwards();
		this.addEventListener('award-issued-dialog', this._openDialog);
	}

	async _getLeaderboard() {
		const myLeaderboard = await LeaderboardService.getLeaderboard(this.orgUnitId, this.sortByCreditsConfig);
		console.log(myLeaderboard); // eslint-disable-line no-console
		this.sortedLeaderboardArray = myLeaderboard.Objects;
		this.doneLoading = true;
	}

	async _getMyAwards() {
		const myAwards = await LeaderboardService.getMyAwards(this.orgUnitId, this.userId);
		if (myAwards === undefined || myAwards === null) {
			return;
		}
		if (Object.prototype.hasOwnProperty.call(myAwards, 'Message')) {
			return;
		}
		this.myAwards = myAwards;
	}

	_createLeaderboardEntry(item, isMyAward) {
		if (item.UserId === undefined) {
			return;
		}
		if (item.UserId === this.userId) {
			isMyAward = true;
		}
		return html`
			<d2l-list-item class="${ isMyAward ? 'myAwardItem' : '' }">
				<leaderboard-row ?myAward=${isMyAward} userData=${JSON.stringify(item)} ?sortByCreditsConfig=${this.sortByCreditsConfig}></leaderboard-row>
			</d2l-list-item>
		`;
	}
	_closeDialog() {
		this.awardsDialogOpen = false;

	}
	_openDialog(e) {
		this.dialogAwardTitle = e.detail.awardTitle;
		this.dialogIssuedId = e.detail.issuedId;
		this.awardsDialogOpen = true;
	}
}

window.customElements.define('d2l-awards-leaderboard-ui', App);
