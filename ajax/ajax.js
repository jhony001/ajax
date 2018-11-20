/* AUTOR Jhon Meneses */

var Forms = {};
var Ajax = {};

(function (namespace){
    var formatData = (data, method) => {
        return new Promise((resolve, reject) => {
            var d;
            var meth = method || "POST"
            meth = meth.toUpperCase();
            d = data;
            if (typeof data != "string" && data instanceof FormData === false && typeof data === "object"){
                if (meth === "GET"){
                    var d = "";
                    for (var key in data){
                        d += key + "=" + data[key] + "&";
                    }
                    d = "?" + d.substring(0, d.length - 1).replace(" ", "%20");
                }
            }else if (data instanceof FormData){
               if (meth === "GET"){
                   d = "";
                   data.forEach((v, k) => {
                       if (typeof v != "string" && typeof v != "number"){
                           reject(new Error(`Los datos contienen un dato binario que no puede ser transformado a una peticion GET
                           para enviar datos binarios como imagenes o archivos envie los datos por metodo POST`));
                       }else {
                           d += k + "=" + v + "&";
                       }
                   });
                   d = "?" + d.substring(0, d.length - 1).replace(" ", "%20");
               }
            }else if(typeof data === "string"){
                var reg = /(^(\??[a-zA-Z]+[0-9]{0,}\={1}[a-zA-Z0-9\-\+\*]{1,}){1}(\&{1}[a-zA-Z]+[0-9]{0,}\={1}[a-zA-Z0-9\-\+\*]{1,}){0,}?)$/
                if (meth === "POST"){
                    if (data.match(reg)){
                        if (data.indexOf('?') != -1){
                            d = data.substring(1, data.length);
                        }else {d = data;}
                        d = d.split('&');
                        var temp;
                        data = '{';
                        for (var i of d){
                            temp = i.split('=');
                            data += '"' + temp[0] + '":';
                            if (temp[1].match(/[a-zA-Z\-\+\*]{1,}/) && !temp[1].match(/^[\-]/)){data += '"' + temp[1] + '"';}
                            else {data += parseInt(temp[1]);}
                            data += ',';
                        }
                        d = data.substring(0, data.length - 1) + '}';
                        d = JSON.parse(d);
                    }else {
                        reject(new Error('La cadena de texto no tiene el formato correcto para ser transformado'));
                    }
                }else if (meth === "GET"){
                    if (data.indexOf('?') === -1){d = "?" + d;}
                }
            }
            resolve(d);
        });
    } // End formatData


    var getForm = (form) => {
        var f;
        if (typeof form === "string"){
            f = document.forms[form] || document.getElementById(form) || document.querySelector(form);
        }else if (form instanceof HTMLFormElement){
            f = form;
        }else {
            f = null;
        }
        return f;
    }
    var getSubmitButton = (form) => {
        var f = getForm(form);
        var submitButton = null;
        if (f != null){
            for (var i = 0;i < f.elements.length;i++){
                if (f.elements[i] != null){
                    var type = f.elements[i].type.toUpperCase();
                    if (type === "SUBMIT"){
                        submitButton = f.elements[i];
                        break;
                    }
                }
            }
        }
        return submitButton;
    }
    var hasFileField = (form) => {
        var fileField = false;
        var f = getForm(form);
        if (f != null){
            for (var i = 0;i < f.elements.length;i++){
                if (f.elements[i] != null){
                    var eType = f.elements[i].type.toUpperCase();
                    if (eType == 'FILE'){
                        fileField = true;
                        break;
                    }
                }
            }
        }else {
            console.error("El formulario" + form + " no existe en el documento");
        }
        return fileField;
   }
    var lookForms = () => {
        for (var i = 0;i < document.forms.length;i++){
            document.forms[i].addEventListener('submit', (e) => {
                e.preventDefault();
            });
        }
    }
    var lookForm = (form) => {
        var f = getForm(form);
        if (f != null){
            f.addEventListener('submit', (evt) => {
                evt.preventDefault();
            });
        }else {
            console.error("El formulario " + form + " no existe en el documento");
        }
    }
    class Request{
        constructor(data, url, enctype, method){
            this.url = url;
            this.enctype = enctype;
            this.data = data;
            this.method = method.toUpperCase() || 'POST';
            var self = this;
        }

        send(){
            var self = this;
            return new Promise(function(resolve, reject){
                Ajax.formatData(self.data, self.method).then((data) => {
                    self.data = data;
                    var req = new XMLHttpRequest();
                    req.onreadystatechange = () => {
                        if (req.status == 200 && req.readyState == 4){
                            resolve(req);
                        }else if (req.status == 404){
                            reject(new Error('El servidor ' + self.url + ' no fue encontrado'));
                        }else if (req.status == 503){
                            reject(new Error('Error interno en el servidor ' + self.url));
                        }
                    }
                    if (self.method === "GET"){
                        req.open(self.method, self.url + self.data, true);
                        req.send();
                    }else {
                        req.open(self.method, self.url, true);
                        req.send(self.data);
                    }
                });
            });
        }
    }
    var ajax = (form, success, handleError) => {
        var succ = success || function(){ console.log('El formulario se ha enviado correctamente'); }
        var handErr = handleError || function(err){ console.error(err.message); }
        var eForm = getForm(form);
        if (eForm != null){
            eForm.addEventListener('submit', function(evt){
                evt.preventDefault();
                var enctype = hasFileField(eForm) == true ? 'multipart/form-data':'application/json';
                var url = eForm.action;
                var method = eForm.hasAttribute('method') ? eForm.method : 'POST';
                var data = new FormData(eForm);
                new Request(data, url, enctype, method).send().then((result) => {
                    succ(result);
                }, (error) => {
                    handErr(error);
                });
            });
        }else {
            handErr(new Error('El formulario ' + form + ' no existe en el documento'));
        }
    }
    Forms.form = {};
    Forms.form.hasFileField = hasFileField;
    Forms.form.getSubmitButton = getSubmitButton;
    Forms.lookForms = lookForms;
    Forms.lookForm = lookForm;
    Forms.getForm = getForm;
    Forms.ajax = ajax;
    Ajax.Request = Request;
    Ajax.formatData = formatData;
})();

//Header for custom form
class Header{
    constructor(title, width, height, color){
        this.title = title;
        this.width = parseInt(width);
        this.height = parseInt(height) * 10 / 100;
        this.color = color;
        this.color = this.color.toUpperCase();
        //this.shadow = this.attachShadow({mode: 'open'});
        this.head = document.createElement('div');
        this.titleSpan = document.createElement('span');
        this.render();
    }
    render(){
        this.titleSpan.innerHTML = '<b>' + this.title + '</b>';
        this.head.setAttribute('style', `
            width: ${this.width};
            height: ${this.height};
            border: 0.2px solid #ddd;
            position: relative;
            background: ${this.color};
        `);
        this.titleSpan.setAttribute('style', `
            position: relative;
            top: 25%;
            left: 3%;
            font-size: ${this.height / 2};
        `);
        this.head.appendChild(this.titleSpan);
    }
    getHeader(){
        return this.head;
    }
}

//Custom form
class Form extends HTMLElement{
    constructor(){
        super();
        this.shadow = this.attachShadow({mode:"open"});
        this.form = document.createElement('form');
    }
    connectedCallback(){
        this.width  = this.getAttribute('width')   || "200px";
        this.height = this.getAttribute('height')  || "200px";
        this.border = this.getAttribute('border')  || "1px solid #ccc";
        this.radius = this.getAttribute('radius')  || "0px";
        this.title  = this.getAttribute('title')   || "Form";
        this.color  = this.getAttribute('color')   || "#ccc";
        this.header = new Header(this.title, this.width , this.height, this.color).getHeader();
        this.render();
    }
    render(){
        this.form.setAttribute('style', `
            width: ${this.width};
            height: ${this.height};
            border: ${this.border};
            border-radius: ${this.radius};
            padding: 0px;
        `);
        this.header.style.borderTopLeftRadius = `${this.radius}`;
        this.header.style.borderTopRightRadius = `${this.radius}`;
        this.form.appendChild(this.header);
        this.shadow.appendChild(this.form);
        Forms.ajax(this.form);
    }
}

window.customElements.define('ajax-form', Form);












