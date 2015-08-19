/**
 * Shopware 5
 * Copyright (c) shopware AG
 *
 * According to our dual licensing model, this program can be used either
 * under the terms of the GNU Affero General Public License, version 3,
 * or under a proprietary license.
 *
 * The texts of the GNU Affero General Public License with an additional
 * permission and of our proprietary license can be found at and
 * in the LICENSE file you have received along with this program.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * "Shopware" is a registered trademark of shopware AG.
 * The licensing of the program under the AGPLv3 does not imply a
 * trademark license. Therefore any rights, title and interest in
 * our trademarks remain entirely with us.
 *
 * @category   Shopware
 * @package    ProductStream
 * @subpackage Window
 * @version    $Id$
 * @author shopware AG
 */

Ext.define('Shopware.apps.ProductStream.view.condition_list.ConditionPanel', {
    extend: 'Ext.form.Panel',
    alias: 'widget.product-stream-condition-panel',
    autoScroll: true,
    layout: { type: 'vbox', align: 'stretch'},
    bodyPadding: 10,
    conditions: [],

    title: 'Conditions',

    initComponent: function() {
        var me = this;

        me.conditions = [];
        me.items = [];
        me.conditionHandlers = me.createConditionHandlers();
        me.dockedItems = [me.createToolbar()];

        me.callParent(arguments);
    },

    loadPreview: function(conditions) {
        this.fireEvent('load-preview', conditions);
    },

    validateConditions: function() {
        return this.getForm().isValid();
    },

    getConditions: function() {
        var me = this;

        var values = me.getValues();
        var conditions = { };

        for (var key in values) {
            if (key.indexOf('condition.') == 0) {
                var newKey = key.replace('condition.', '');
                conditions[newKey] = values[key];
            }
        }
        return conditions;
    },

    putItemInContainer: function(item, container) {
        var me = this;

        container.name = item.getName();
        container.add(item);
        me.conditions.push(item.getName());
        me.add(container);
    },

    loadConditions: function(record) {
        var me = this;
        var conditions = record.get('conditions');

        for (var key in conditions) {
            var condition = conditions[key];

            Ext.each(me.conditionHandlers, function(handler) {
                var container = me.createConditionContainer(handler);
                var item = handler.load(key, condition, container, conditions);
                if (item) {
                    container.collapsed = true;
                    me.putItemInContainer(item, container);
                }
            });
        }

        if (!record.get('id')) {
            return;
        }

        me.loadPreview(conditions);
    },

    createConditionHandlers: function() {
        return [
            Ext.create('Shopware.apps.ProductStream.view.condition_list.condition.Price'),
            Ext.create('Shopware.apps.ProductStream.view.condition_list.condition.Manufacturer'),
            Ext.create('Shopware.apps.ProductStream.view.condition_list.condition.Property'),
            Ext.create('Shopware.apps.ProductStream.view.condition_list.condition.Attribute'),
            Ext.create('Shopware.apps.ProductStream.view.condition_list.condition.Category'),
            Ext.create('Shopware.apps.ProductStream.view.condition_list.condition.ImmediateDelivery'),
            Ext.create('Shopware.apps.ProductStream.view.condition_list.condition.HasPseudoPrice'),
            Ext.create('Shopware.apps.ProductStream.view.condition_list.condition.CreateDate'),
            Ext.create('Shopware.apps.ProductStream.view.condition_list.condition.ReleaseDate'),
            Ext.create('Shopware.apps.ProductStream.view.condition_list.condition.VoteAverage'),
            Ext.create('Shopware.apps.ProductStream.view.condition_list.condition.Sales'),
            Ext.create('Shopware.apps.ProductStream.view.condition_list.condition.SearchTerm')
        ];
    },

    addCondition: function(conditionHandler) {
        var me = this;

        var container = me.createConditionContainer(conditionHandler);
        conditionHandler.create(function(item) {
            var singleton = conditionHandler.isSingleton();
            var name = item.getName();


            if (singleton && me.conditions.indexOf(name) > -1) {
                Shopware.Notification.createGrowlMessage('Singleton filter', 'Filter can only be added one time');
                return;
            }

            me.putItemInContainer(item, container);

        }, container, me.conditions);
    },

    createConditionContainer: function(conditionHandler) {
        var me = this;

        return Ext.create('Ext.panel.Panel', {
            title: conditionHandler.getLabel(),
            items: [],
            collapsible: true,
            closable: true,
            bodyPadding: 5,
            margin: '0 0 5',
            fixToggleTool: function() {
                this.addTool(Ext.widget({
                    xtype: 'tool',
                    type: (this.collapsed && !this.isPlaceHolderCollapse()) ? ('expand-' + this.getOppositeDirection(this.collapseDirection)) : ('collapse-' + this.collapseDirection),
                    handler: this.toggleCollapse,
                    scope: this
                }));
            },
            listeners: {
                close: function() {
                    var index = me.conditions.indexOf(this.name);
                    delete me.conditions[index];
                }
            },
            layout: { type: 'vbox', align: 'stretch' }
        });
    },

    createToolbar: function() {
        var me = this;

        me.toolbar = Ext.create('Ext.toolbar.Toolbar', {
            items: me.createToolbarItems(),
            style: 'border: 1px solid #9aacb8;',
            ui: 'shopware-ui'
        });
        return me.toolbar;
    },

    createToolbarItems: function() {
        var me = this,
            items = [];

        me.addButton = Ext.create('Ext.button.Split', {
            text: 'Add condition',
            iconCls: 'sprite-plus-circle-frame',
            menu: me.createMenu()
        });

        me.previewButton = Ext.create('Ext.button.Button', {
            text: 'Refresh preview',
            iconCls: 'sprite-arrow-circle-225-left',
            handler: function() {
                me.loadPreview();
            }
        });

        items.push(me.addButton);
        items.push('->');
        items.push(me.previewButton);
        return items;
    },

    createMenu: function() {
        var me = this, items = [];

        Ext.each(me.conditionHandlers, function(handler) {
            items.push({
                text: handler.getLabel(),
                conditionHandler: handler,
                handler: function() {
                    me.addCondition(this.conditionHandler);
                }
            });
        });

        return new Ext.menu.Menu({ items: items });
    }
});
