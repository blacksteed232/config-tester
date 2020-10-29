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

import React, { useEffect, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import ReactResizeDetector from 'react-resize-detector';
import { GlobalHotKeys } from 'react-hotkeys';
import { SIDE_BAR_RESIZE_SNAP_THRESHOLD, DEFAULT_SIDE_BAR_SIZE, AUX_PANEL_RESIZE_TOP_SNAP_THRESHOLD, AUX_PANEL_RESIZE_BOTTOM_SNAP_THRESHOLD, HOTKEY, HOTKEY_MAP } from 'Stores/EditorConfig';
import { EditorStoreProvider, useEditorStore } from 'Stores/EditorStore';
import clsx from 'clsx';
import Backdrop from '@material-ui/core/Backdrop';
// import { useApplicationStore } from 'Stores/ApplicationStore';
import type { HandlerProps } from 'react-reflex';
import { ReflexContainer, ReflexElement, ReflexSplitter } from 'react-reflex';
import { Logo } from 'Components/shared/Logo';

export const EditorInner = observer(() => {
  const editorStore = useEditorStore();

  // eslint-disable-next-line no-process-env
  if (process.env.NODE_ENV === 'development') {
    const stylesheet = document.createElement('style');
    stylesheet.innerHTML = `
      /* For development, this needs to be injected before stylesheet, else \`react-reflex\` panel dimension calculation will be off */
      .reflex-container { height: 100%; width: 100%; }
      .reflex-container.horizontal { flex-direction: column; min-height: 1px; }
      .reflex-container.vertical { flex-direction: row; min-width: 1px; }
      .reflex-container > .reflex-element { height: 100%; width: 100%; }
      .reflex-container > .reflex-element > .reflex-size-aware { height: 100%; width: 100%; }`;
    document.head.prepend(stylesheet);
  }
  // const applicationStore = useApplicationStore();

  // Resize
  const editorContainerRef = useRef<HTMLDivElement>(null);
  // These create snapping effect on panel resizing
  const snapSideBar = (handlerProps: HandlerProps): void => {
    const newSize = (handlerProps.domElement as HTMLDivElement).offsetWidth;
    editorStore.setSideBarSize(newSize < SIDE_BAR_RESIZE_SNAP_THRESHOLD ? (editorStore.sideBarSize > 0 ? 0 : DEFAULT_SIDE_BAR_SIZE) : newSize);
  };
  const handleResize = (): void => {
    if (editorContainerRef.current) {
      // editorStore.setMaxAuxPanelSize(editorContainerRef.current.offsetHeight);
    }
  };
  const snapAuxPanel = (handlerProps: HandlerProps): void => {
    const newSize = (handlerProps.domElement as HTMLDivElement).offsetHeight;
    if (editorContainerRef.current) {
      if (newSize >= editorContainerRef.current.offsetHeight - AUX_PANEL_RESIZE_TOP_SNAP_THRESHOLD) {
        editorStore.setAuxPanelSize(editorContainerRef.current.offsetHeight);
      } else if (newSize <= AUX_PANEL_RESIZE_BOTTOM_SNAP_THRESHOLD) {
        editorStore.setAuxPanelSize(editorStore.auxPanelSize > 0 ? 0 : AUX_PANEL_RESIZE_BOTTOM_SNAP_THRESHOLD);
      } else {
        editorStore.setAuxPanelSize(newSize);
      }
    }
  };

  useEffect(() => {
    if (editorContainerRef.current) {
      // editorStore.setMaxAuxPanelSize(editorContainerRef.current.offsetHeight);
    }
  }, [editorStore]);

  // Hotkeys
  const keyMap = {
    [HOTKEY.SEARCH_FILE]: HOTKEY_MAP[HOTKEY.SEARCH_FILE],
    [HOTKEY.SEARCH_TEXT]: HOTKEY_MAP[HOTKEY.SEARCH_TEXT],
    [HOTKEY.EXECUTE]: HOTKEY_MAP[HOTKEY.EXECUTE],
    [HOTKEY.TOGGLE_AUX_PANEL]: HOTKEY_MAP[HOTKEY.TOGGLE_AUX_PANEL],
    [HOTKEY.GO_TO_FILE]: HOTKEY_MAP[HOTKEY.GO_TO_FILE],
    [HOTKEY.FULL_RECOMPILE]: HOTKEY_MAP[HOTKEY.FULL_RECOMPILE],
    [HOTKEY.RUN_TEST]: HOTKEY_MAP[HOTKEY.RUN_TEST],
  };
  const handlers = {
  };

  // Cleanup the editor
  useEffect(() => (): void => { editorStore.cleanUp() }, [editorStore]);

  return (
    <div className="editor">
      <GlobalHotKeys keyMap={keyMap} handlers={handlers}>
        <div className="editor__body">
          <div className="activity-bar">
            <div className="activity-bar__logo">
              <Logo />
            </div>
            <div className="activity-bar__items">
            </div>
          </div>
          <Backdrop className="backdrop" open={editorStore.backdrop} />
          <ReactResizeDetector
            handleHeight={true}
            handleWidth={true}
            onResize={handleResize}
          >
            <div className="editor__content-container" ref={editorContainerRef}>
              <div className={clsx('editor__content', { 'editor__content--expanded': editorStore.isInExpandedMode })}>
                <ReflexContainer orientation="vertical">
                  <ReflexElement size={editorStore.sideBarSize} minSize={0} onStopResize={snapSideBar}>
                    <div className="side-bar">
                      <div key={editorStore.activeActivity} className={clsx('side-bar__view', 'side-bar__view--active')}>
                        SideBar
                      </div>
                    </div>
                  </ReflexElement>
                  <ReflexSplitter />
                  <ReflexElement minSize={100} className="container-1">
                    {((): React.ReactNode => {
                      // document.getElementsByClassName("container-1");
                      // eslint-disable-next-line no-console
                      console.log('rendering...');
                      return (
                        <ReflexContainer orientation="horizontal">
                          <ReflexElement minSize={0}>
                            <div className="side-bar edit-panel">
                              <div key={editorStore.activeActivity} className={clsx('side-bar__view', 'side-bar__view--active')}>
                                EditPanel
                              </div>
                            </div>
                          </ReflexElement>
                          <ReflexSplitter />
                          <ReflexElement size={editorStore.auxPanelSize} direction={-1} minSize={0} onStopResize={snapAuxPanel}>
                            <div className="side-bar console">
                              <div key={editorStore.activeActivity} className={clsx('side-bar__view', 'side-bar__view--active')}>
                                Console
                              </div>
                            </div>
                          </ReflexElement>
                        </ReflexContainer>
                      );
                    })()}
                  </ReflexElement>
                </ReflexContainer>
              </div>
            </div>
          </ReactResizeDetector>
        </div>
        <div className={clsx('editor__status-bar')}></div>
      </GlobalHotKeys>
    </div >
  );
});

export const Editor: React.FC = () => (
  <EditorStoreProvider>
    <EditorInner />
  </EditorStoreProvider>
);
