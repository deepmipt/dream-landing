import React, { FC, useCallback, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCamera,
  faDownload,
  faRefresh,
  faBars,
  faArrowLeft,
} from "@fortawesome/free-solid-svg-icons";
import { faTelegram } from "@fortawesome/free-brands-svg-icons";

import styles from "./sidebar.module.css";
import ActionBtn from "./ActionBtn";

const Sidebar: FC<{
  onScreenshot?: () => void;
  onReset?: () => void;
  onDownload?: () => void;
}> = ({ onScreenshot, onReset }) => {
  return (
    <>
      <div className={styles["hamburger"]}>
        <label htmlFor="menu-toggle">
          <FontAwesomeIcon icon={faBars} />
        </label>
      </div>
      <input
        type="checkbox"
        id="menu-toggle"
        className={styles["menu-toggle"]}
      />

      <div className={styles["sidebar"]}>
        <label htmlFor="menu-toggle" className={styles["back-arrow"]}>
          <FontAwesomeIcon icon={faArrowLeft} />
        </label>

        <div className={styles["avatar"]} />
        <div className={styles["scroll-cont"]}>
          <div className={styles["title"]}>Dream Socialbot</div>
          <div className={styles["desc"]}>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
            eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim
            ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut
            aliquip ex ea commodo consequat.
          </div>

          <div className={styles["small-title"]}>Actions</div>
          <div className={styles["actions-cont"]}>
            <ActionBtn icon={faCamera} onClick={onScreenshot}>
              Take screenshot
            </ActionBtn>
            <ActionBtn icon={faDownload}>Download other dialogs</ActionBtn>
            <ActionBtn icon={faRefresh} onClick={onReset}>
              Start a new dialog
            </ActionBtn>
          </div>

          <div className={styles["small-title"]}>Messengers</div>
          <div className={styles["messengers-cont"]}>
            <div className={styles["messenger-btn"]}>
              <FontAwesomeIcon size="2x" icon={faTelegram} />
            </div>
          </div>

          <a className={styles["disclaimer"]}>Disclaimer of responsibility</a>
        </div>
      </div>

      <label htmlFor="menu-toggle" className={styles["fog"]} />
    </>
  );
};

export default Sidebar;
