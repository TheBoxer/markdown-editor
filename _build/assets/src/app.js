var MarkdownEditor = function(config) {
    config = config || {};
    MarkdownEditor.superclass.constructor.call(this,config);
};
Ext.override(MODx.panel.Resource, {});

Ext.extend(MarkdownEditor,Ext.Component,{
    initComponent: function() {
        MarkdownEditor.superclass.initComponent.call(this);

        Ext.onReady(this.render, this);
    }

    ,buildUI: function() {
        this.textarea.setDisplayed('none');
        this.textarea.setWidth(0);
        this.textarea.setHeight(0);

        Ext.DomHelper.insertBefore(this.textarea, {
            tag: 'textarea',
            name: 'ta_markdown',
            id: 'ta_markdown'
        });

        this.taMarkdown = Ext.get('ta_markdown');
        this.taMarkdown.setDisplayed('none');
        this.taMarkdown.setWidth(0);
        this.taMarkdown.setHeight(0);

        var wrapper = Ext.DomHelper.insertBefore(this.textarea, {
            tag: 'div',
            class: 'markdown-container'
        });

        Ext.DomHelper.append(wrapper,{
            tag: 'div',
            id: 'content-md',
            class: this.textarea.dom.className
        });

        Ext.DomHelper.append(wrapper,{
            tag: 'div',
            id: 'preview-md',
            class: 'markdown-body'
        });

        Ext.DomHelper.append(wrapper,{
            tag: 'div',
            id: 'toolbox',
            cn: [{
                tag: 'span',
                id: 'preview-button',
                html: '<i class="icon icon-toggle-off"></i> Preview'
            },{
                tag: 'span',
                id: 'fullscreen-button',
                html: '<i class="icon icon-expand"></i>'
            }]
        });

        Ext.DomHelper.append(wrapper,{
            tag: 'span',
            style: 'clear: both',
        });
    }

    ,registerAce: function() {
        var mde = this;
        this.editor = ace.edit(Ext.DomQuery.selectNode('div#content-md'));
        this.editor.setOptions({
            maxLines: Infinity,
            minLines: 25,
        });
        this.editor.renderer.setShowGutter(true);
        this.editor.renderer.setScrollMargin(10, 10);
        this.editor.getSession().setValue(this.textarea.getValue());
        this.editor.getSession().setMode("ace/mode/markdown");
        this.editor.setTheme("ace/theme/monokai");
    }

    ,languageOverrides: {
        js: 'javascript'
        ,html: 'xml'
    }

    ,registerMarked: function() {
        var mde = this;
        var renderer = new marked.Renderer();

        renderer.code = function(code, lang, escaped) {
            if (this.options.highlight) {
                var out = this.options.highlight(code, lang);
                if (out != null && out !== code) {
                    escaped = true;
                    code = out;
                }
            }

            if (!lang) {
                return '<pre><code>'
                + (escaped ? code : escape(code, true))
                + '\n</code></pre>';
            }

            return '<pre><code class="hljs '
            + this.options.langPrefix
            + escape(lang, true)
            + '">'
            + (escaped ? code : escape(code, true))
            + '\n</code></pre>\n';
        };

        marked.setOptions({
            highlight: function(code, lang){
                if(mde.languageOverrides[lang]) lang = mde.languageOverrides[lang];
                return (hljs.listLanguages().indexOf(lang) != -1) ? hljs.highlight(lang, code).value : code;
            },
            renderer: renderer
        });
    }

    ,render: function() {
        var mde = this;
        this.textarea = Ext.get('ta');

        this.buildUI();
        this.registerAce();
        this.registerMarked();


        // copy back to textarea on form submit...
        //textarea.closest('form').submit(function () {
        //    textarea.val(editor.getSession().getValue());
        //});



        var previewButton = Ext.get('preview-button');
        var fullscreenButton = Ext.get('fullscreen-button');
        var preview = Ext.get('preview-md');
        var content = Ext.get('content-md');
        var wrapper = content.parent();

        var dropTarget = MODx.load({
            xtype: 'modx-treedrop',
            target: content,
            targetEl: content,
            onInsert: (function(s){
                this.insert(s);
                this.focus();
                return true;
            }).bind(this.editor),
            iframe: true
        });
        this.textarea.on('destroy', function() {dropTarget.destroy();});

        previewButton.addListener('click', function () {
            if (preview.isVisible()) {
                preview.setDisplayed('none');
                content.setDisplayed('block');

                previewButton.child('i').removeClass('icon-toggle-on');
                previewButton.child('i').addClass('icon-toggle-off');
            } else {
                preview.setDisplayed('block');
                content.setDisplayed('none');

                previewButton.child('i').removeClass('icon-toggle-off');
                previewButton.child('i').addClass('icon-toggle-on');
            }
        });

        fullscreenButton.addListener('click', function () {
            var icon = fullscreenButton.child('i');

            if (icon.hasClass('icon-expand')) {
                icon.removeClass('icon-expand');
                icon.addClass('icon-compress');

                preview.setDisplayed('block');
                content.setDisplayed('block');

                previewButton.hide();

                wrapper.addClass('fullscreen');

                this.editor.setOption('maxLines', null);
                //this.editor.setAutoScrollEditorIntoView(false);

            } else {
                icon.addClass('icon-expand');
                icon.removeClass('icon-compress');

                preview.setDisplayed('none');
                content.setDisplayed('block');

                previewButton.show();

                wrapper.removeClass('fullscreen');

                this.editor.setOption('maxLines', Infinity);
                //this.editor.setAutoScrollEditorIntoView(true);

            }

            this.editor.resize(true);
        }, this);

        this.editor.setValue(MarkdownEditor_content.content);
        this.editor.selection.clearSelection();

        preview.update(marked(this.editor.getValue()));
        this.editor.getSession().on('change', function(){
            var parsed = marked(mde.editor.getValue());

            mde.textarea.dom.value = parsed;
            mde.taMarkdown.dom.value = mde.editor.getValue();
            preview.update(parsed);
        });
    }
});
MarkdownEditor = new MarkdownEditor();