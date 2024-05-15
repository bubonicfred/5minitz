import { Meteor } from "meteor/meteor";
import { FlowRouter } from "meteor/ostrio:flow-router-extra";
import { ReactiveVar } from "meteor/reactive-var";
import { Template } from "meteor/templating";

Template.admin.onCreated(function () {
  // The default Tab
  this.activeTabTemplate = new ReactiveVar("tabAdminUsers");
  this.activeTabId = new ReactiveVar("tab_users");
});

Template.admin.helpers({
  redirectIfNotAllowed() {
    if (!Meteor.user() || !Meteor.user().isAdmin) {
      FlowRouter.go("/");
    }
  },

  // give active tab some CSS highlighting
  isTabActive(tabId) {
    return Template.instance().activeTabId.get() === tabId ? "active" : "";
  },

  tab() {
    return Template.instance().activeTabTemplate.get();
  },
});

Template.admin.events({
  // Switch between tabs via user click on <li>
  "click .nav-tabs li"(event, tmpl) {
    const currentTab = event.currentTarget.closest("li");

    tmpl.activeTabId.set(currentTab.id);
    tmpl.activeTabTemplate.set(currentTab.dataset.template);
  },
});
