/**
 * Copyright 2020 Goldman Sachs
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React, { createContext, useContext } from 'react';
import { useLocalObservable } from 'mobx-react-lite';
import { makeAutoObservable } from 'mobx';
import type { ApplicationStore, ActionAlertInfo, BlockingAlertInfo } from './ApplicationStore';
import { useApplicationStore } from './ApplicationStore';
import { ACTIVITY_MODE, DEFAULT_SIDE_BAR_SIZE, AUX_PANEL_MODE, DEFAULT_AUX_PANEL_SIZE } from 'Stores/EditorConfig';
import { guaranteeNonNullable } from 'Utilities/GeneralUtil';
import { ActionState } from 'Utilities/ActionState';

export class EditorStore {
  applicationStore: ApplicationStore;
  initState = new ActionState();
  // App states
  isInExpandedMode = true;
  backdrop = false;
  blockGlobalHotkeys = false;
  // Aux Panel
  isMaxAuxPanelSizeSet = false;
  activeAuxPanelMode = AUX_PANEL_MODE.CONSOLE;
  maxAuxPanelSize = DEFAULT_AUX_PANEL_SIZE;
  auxPanelSize = DEFAULT_AUX_PANEL_SIZE;
  previousAuxPanelSize = 0;
  // Side Bar
  activeActivity?: ACTIVITY_MODE = ACTIVITY_MODE.CONCEPT;
  sideBarSize = DEFAULT_SIDE_BAR_SIZE;
  sideBarSizeBeforeHidden = DEFAULT_SIDE_BAR_SIZE;

  constructor(applicationStore: ApplicationStore) {
    makeAutoObservable(this);
    this.applicationStore = applicationStore;
  }

  get isAuxPanelMaximized(): boolean { return this.auxPanelSize === this.maxAuxPanelSize }

  setBlockGlobalHotkeys(val: boolean): void { this.blockGlobalHotkeys = val }
  setBackdrop(val: boolean): void { this.backdrop = val }
  setExpandedMode(val: boolean): void { this.isInExpandedMode = val }
  setAuxPanelSize(val: number): void { this.auxPanelSize = val }
  setActiveAuxPanelMode(val: AUX_PANEL_MODE): void { this.activeAuxPanelMode = val }
  setSideBarSize(val: number): void { this.sideBarSize = val }
  setActionAltertInfo(alertInfo: ActionAlertInfo | undefined): void { this.applicationStore.setActionAltertInfo(alertInfo) }
  setBlockingAlert(alertInfo: BlockingAlertInfo | undefined): void {
    this.setBlockGlobalHotkeys(Boolean(alertInfo)); // block global hotkeys if alert is shown
    this.applicationStore.setBlockingAlert(alertInfo);
  }

  cleanUp(): void {
    // dismiss all the alerts as these are parts of application, if we don't do this, we might
    // end up blocking other parts of the app
    // e.g. trying going to an unknown workspace, we will be redirected to the home page
    // but the blocking alert for not-found workspace will still block the app
    this.setBlockingAlert(undefined);
    this.setActionAltertInfo(undefined);
  }

  /**
   * This is the entry of the app logic where initialization of editor states happens
   * Here, we ensure the order of calls after checking existence of current project and workspace
   * If either of them does not exist, we cannot proceed.
   */
  *initialize(this: EditorStore, fullInit: boolean, func: (() => Promise<void>) | undefined, mode: string | undefined, fastCompile: string | undefined): Generator<Promise<unknown>, void, unknown> {
    if (!this.initState.isInInitialState) {
      this.applicationStore.notifyIllegalState('Editor store is re-initialized');
      return;
    }
    // initialize editor
    this.initState.inProgress();
    this.initState.conclude(true);
  }

  createGlobalHotKeyAction = (handler: (event?: KeyboardEvent | undefined) => void): (event: KeyboardEvent | undefined) => void => (event: KeyboardEvent | undefined): void => {
    event?.preventDefault();
    if (!this.blockGlobalHotkeys) { handler(event) }
  }
}

const EditorStoreContext = createContext<EditorStore | undefined>(undefined);

export const EditorStoreProvider = ({ children }: { children: React.ReactNode }): React.ReactElement => {
  const applicationStore = useApplicationStore();
  const store = useLocalObservable(() => new EditorStore(applicationStore));
  return <EditorStoreContext.Provider value={store}>{children}</EditorStoreContext.Provider>;
};

export const useEditorStore = (): EditorStore =>
  guaranteeNonNullable(useContext(EditorStoreContext), 'useEditorStore() hook must be used inside EditorStore context provider');
