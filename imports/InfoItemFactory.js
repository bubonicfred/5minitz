import { ActionItem } from "./actionitem";
import { InfoItem } from "./infoitem";

/**
 * Factory class for creating InfoItems and ActionItems.
 */
export class InfoItemFactory {
  /**
   * Creates a new InfoItem or ActionItem
   * depending on the given infoItemDoc.
   *
   * InfoItems and ActionItems differ by
   * the itemType-property
   *
   * @param {ParentTopic} parentTopic - The parent topic of the info item.
   * @param {InfoItemDoc} infoItemDoc - The document representing the info item.
   * @returns {InfoItem|ActionItem} - The created info item.
   */
  static createInfoItem(parentTopic, infoItemDoc) {
    return InfoItem.isActionItem(infoItemDoc)
      ? new ActionItem(parentTopic, infoItemDoc)
      : new InfoItem(parentTopic, infoItemDoc);
  }
}
