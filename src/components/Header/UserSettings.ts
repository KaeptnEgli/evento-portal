import { css, html, LitElement, nothing } from "lit";
import { customElement, queryAll } from "lit/decorators.js";
import { localized, msg } from "@lit/localize";
import { StateController } from "@lit-app/state";

import { theme } from "../../utils/theme.ts";
import { DropdownToggleController } from "../../controllers/dropdown-toggle.ts";
import { map } from "lit/directives/map.js";
import { UserSettingItem, userSettingItems } from "../../utils/userSettings.ts";
import { isExternalUrl } from "../../utils/url.ts";
import { portalState } from "../../state/portal-state.ts";

@customElement("bkd-user-settings")
@localized()
export class UserSettings extends LitElement {
  @queryAll("a")
  private menuLinks?: NodeListOf<HTMLElement>;

  static styles = [
    theme,
    css`
      :host {
        display: flex;
        position: relative;
      }

      button {
        background: transparent;
        border: none;
        cursor: pointer;
      }

      ul {
        position: absolute;
        right: 0;
        border: 1px solid var(--bkd-func-bg-grey);
        padding: 1rem 0;
        list-style-type: none;
        margin-top: calc(32px + 0.5rem);
        background: var(--bkd-func-bg-white);
        z-index: var(--bkd-z-index-dropdown);
        min-width: max-content;
      }

      li {
        padding: 0 1.5rem;
        display: flex;
        gap: 0.5rem;
        align-items: center;
        height: 36px;
      }

      li.selected {
        color: var(--bkd-brand-red);
        background: var(--bkd-brand-sand);
        border-left: 6px solid var(--bkd-brand-red);
        font-weight: 700;
        padding: 0 calc(1.5rem - 6px);
      }

      a {
        font-size: 0.875rem;
        font-weight: 400;
        color: var(--bkd-func-fg-black);
        letter-spacing: 0.01rem;
        word-spacing: 0.025rem;
        text-decoration: none;
        display: inline-block;
        margin-top: 2px;
      }

      a:after {
        display: block;
        content: "";
        height: 2px;
        background-color: var(--bkd-brand-black);
        transform: scaleX(0);
        transition: all 150ms ease-in-out;
      }

      a:hover::after,
      a:focus::after {
        transform: scaleX(1);
      }
    `,
  ];

  constructor() {
    super();
    new StateController(this, portalState);
  }

  private settingsMenu = new DropdownToggleController(
    this,
    "settings-toggle",
    "settings-menu"
  );

  private handleSettingsItemClick(e: MouseEvent, item: UserSettingItem) {
    e.preventDefault();
    if (isExternalUrl(item.href, this.baseURI)) {
      window.open(item.href, "_blank");
    }
    console.log("handleSettingsItemClick", item); // TODO: perform actual navigation action
    this.settingsMenu.close();
  }

  private toggle() {
    this.settingsMenu.toggle();
    if (this.settingsMenu.open) {
      document.addEventListener("keydown", this.handleKeydown);
    } else {
      document.removeEventListener("keydown", this.handleKeydown);
    }
  }

  private handleKeydown = (e: KeyboardEvent) => {
    if (!this.menuLinks) return;
    switch (e.key) {
      case "ArrowDown": {
        const next = this.nextLinkIndex(1);
        this.menuLinks[next].focus();
        break;
      }
      case "ArrowUp": {
        const previous = this.nextLinkIndex(-1);
        this.menuLinks[previous].focus();
        break;
      }
    }
  };

  private activeLinkIndex(): number | null {
    const active = (this.shadowRoot?.activeElement ??
      null) as HTMLElement | null;
    const index = active
      ? Array.from(this.menuLinks ?? []).indexOf(active)
      : -1;
    return index === -1 ? null : index;
  }

  private nextLinkIndex(offset: number): number {
    const active = this.activeLinkIndex();
    const first = 0;
    const last = this.menuLinks ? this.menuLinks.length - 1 : 0;

    if (active === null) {
      return offset > 0 ? first : last;
    }

    const next = active + offset;
    if (next > last) return first;
    if (next < first) return last;
    return next;
  }

  private renderSettingsItem(item: UserSettingItem) {
    return html`<li role="presentation">
      <a
        role="menuitem"
        href=${item.href}
        @click=${(e: MouseEvent) => this.handleSettingsItemClick(e, item)}
      >
        ${item.label}</a
      >
      ${item.img
        ? html`<img src=${item.img} alt="" width="24" height="24" />`
        : nothing}
    </li>`;
  }

  render() {
    return html`
      <button
        type="button"
        id="settings-toggle"
        @click=${this.toggle.bind(this)}
        aria-label=${msg("Menü Benutzereinstellungen")}
        aria-expanded=${this.settingsMenu.open}
        aria-haspopup="menu"
      >
        <img src="/icons/settings.svg" alt="" width="32" height="32" />
      </button>
      <ul id="settings-menu" role="menu" ?hidden=${!this.settingsMenu.open}>
        ${map(
          userSettingItems(portalState.locale),
          this.renderSettingsItem.bind(this)
        )}
      </ul>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "bkd-user-settings": UserSettings;
  }
}
