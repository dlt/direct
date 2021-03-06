/**
 * Replaces a component with another.
 * @param {Component} newComponent the new component to replace this one with
 * @return {Component} this the replaced component
 */
Ext.override(Ext.Component, {
    replaceWith : function(newComponent){
        var ctnr = this.ownerCt;
        var form = newComponent.ownerForm ? newComponent.ownerForm : this.refOwner.form;

        var i = ctnr.items.indexOf(this);

        Ext.applyIf(newComponent, this.initialConfig);

        ctnr.remove(this, true);
        var added = ctnr.insert(i, newComponent);

        if (form){

            form.remove(this);
            form.add(added);
        }

    }
});

/**
 * Adds capability of send namespace information to requests
 */
Ext.override(Ext.direct.RemotingProvider,{
    
    getCallData: function(t){
        return {
            action: t.action,
            method: t.method,
            data: t.data,
            namespace: t.namespace, //  added this line
            type: 'rpc',
            tid: t.tid
        };
    },

    doCall : function(c, m, args){
        var data = null, hs = args[m.len], scope = args[m.len+1];

        if(m.len !== 0){
            data = args.slice(0, m.len);
        }

        var t = new Ext.Direct.Transaction({
            provider: this,
            args: args,
            action: c,
            method: m.name,
            namespace:  m.remotens, // overrided
            data: data,
            cb: scope && Ext.isFunction(hs) ? hs.createDelegate(scope) : hs
        });

        if(this.fireEvent('beforecall', this, t, m) !== false){
            Ext.Direct.addTransaction(t);
            this.queueTransaction(t);
            this.fireEvent('call', this, t, m);
        }
    },

    doForm : function(c, m, form, callback, scope){
        var t = new Ext.Direct.Transaction({
            provider: this,
            action: c,
            method: m.name,
            args:[form, callback, scope],
            cb: scope && Ext.isFunction(callback) ? callback.createDelegate(scope) : callback,
            isForm: true
        });

        if(this.fireEvent('beforecall', this, t, m) !== false){
            Ext.Direct.addTransaction(t);
            var isUpload = String(form.getAttribute("enctype")).toLowerCase() == 'multipart/form-data',
                params = {
                    extTID: t.tid,
                    extAction: c,
                    extMethod: m.name,
                    extNamespace: m.remotens, // overrided
                    extType: 'rpc',
                    extUpload: String(isUpload)
                };

            // change made from typeof callback check to callback.params
            // to support addl param passing in DirectSubmit EAC 6/2
            Ext.apply(t, {
                form: Ext.getDom(form),
                isUpload: isUpload,
                params: callback && Ext.isObject(callback.params) ? Ext.apply(params, callback.params) : params
            });
            this.fireEvent('call', this, t, m);
            this.processForm(t);
        }
    }
});

/**
 * Adds features to Ext.form.DisplayField.
 *
 * @param {Component} newComponent the new component to replace this one with
 * @return {Component} this the replaced component
 */
Ext.override(Ext.form.DisplayField, {
        getValue : function(){
		return this.value;
	},
	setValue : function(v){
		this.value = v;
		this.setRawValue(this.formatValue(v));
		return this;
	},

	formatValue : function(v){
		var renderer = this.renderer, scope = this.rendererScope || this;
		if(!renderer){
			return v;
		}
		if(typeof renderer == 'string'){
			renderer = Ext.util.Format[renderer];
		} else if(typeof renderer == 'object'){
			renderer = renderer.fn;
			scope = renderer.scope;
		}
		var args = [v];
		if(this.format){
			args.push(this.format);
		}else if(this.formatArgs){
			args = args.concat(this.formatArgs);
		}
		return renderer.apply(scope, args);
	}
});

/**
 * Adds features to the BasicForm
 */

Ext.override(Ext.form.BasicForm,{

    /**
     * Overrides the constructor of class
     * @todo Create a sequence to this method to improving the readibilty and coding
     */
    constructor: function(el, config){
        Ext.apply(this, config);
        if(Ext.isString(this.paramOrder)){
            this.paramOrder = this.paramOrder.split(/[\s,|]/);
        }

        this.items = new Ext.util.MixedCollection(false, function(o){
            return o.getItemId();
        });
        this.addEvents(

            'beforeaction',

            'actionfailed',

            'actioncomplete',

            'reset',

            'setvalues'
        );

        if(el){
            this.initEl(el);
        }
        Ext.form.BasicForm.superclass.constructor.call(this);
    },

    /**
     * Overrides the reset method.
     * @todo Create a sequence to this method to improving the readibilty and coding
     */
    reset : function(){
        this.items.each(function(f){
            try{
                f.reset();
            }catch(e){}
        });

        this.fireEvent('reset',this);

        return this;
    },

    /**
     * Overrides the setValues method.
     * @todo Create a sequence to this method to improving the readibilty and coding
     */
    setValues : function(values){
        if(Ext.isArray(values)){
            for(var i = 0, len = values.length; i < len; i++){
                var v = values[i];
                var f = this.findField(v.id);
                if(f){
                    f.setValue(v.value);
                    if(this.trackResetOnLoad){
                        f.originalValue = f.getValue();
                    }
                }
            }
        }else{
            var field, id;
            for(id in values){
                if(!Ext.isFunction(values[id]) && (field = this.findField(id))){
                    field.setValue(values[id]);
                    if(this.trackResetOnLoad){
                        field.originalValue = field.getValue();
                    }
                }
            }
        }

        this.fireEvent('setvalues',values,this);

        return this;
    }
});

Ext.override(Ext.form.ComboBox, {
    assertValue  : function(){
        var val = this.getRawValue(),
            rec;
        if(this.valueField && Ext.isDefined(this.value)){
            rec = this.findRecord(this.valueField, this.value);
        }
        if(!rec || rec.get(this.displayField) != val){
            rec = this.findRecord(this.displayField, val);
        }
        if(!rec && this.forceSelection){
            if(val.length > 0 && val != this.emptyText){
                this.el.dom.value = Ext.value(this.lastSelectionText, '');
                this.applyEmptyText();
            }else{
                this.clearValue();
            }
        }else{
            if(rec && this.valueField){
                val = rec.get(this.valueField/* || this.displayField*/);
                if (/*val == rec.get(this.displayField) &&*/ this.value == val /*rec.get(this.valueField)*/){
                    return;
                }
            }
            this.setValue(val);
        }
    }
});

