import { Label } from "/imports/label";
import { Meteor } from "meteor/meteor";

export function createLabelIdsReceiver(parentMeetingSeriesId) {
  return function getLabelIdsByName(labelName, caseSensitive) {
    const label = Label.findLabelsContainingSubstring(
      parentMeetingSeriesId,
      labelName,
      caseSensitive,
    );
    if (label !== null) {
      return label.map((label) => {
        return label._id;
      });
    }
    return null;
  };
}
export function createUserIdsReceiver(userName) {
  const users =
    userName === "me"
      ? [Meteor.user()]
      : Meteor.users.find({ username: { $regex: userName } }).fetch();
  if (users) {
    return users.map((user) => {
      return user._id;
    });
  }

  return [];
}
