
com=window.com||{};com.marklogic=window.com.marklogic||{};com.marklogic.widgets=window.com.marklogic.widgets||{};com.marklogic.widgets.create=function(container){this.container=container;this.errorPublisher=new com.marklogic.events.Publisher();this.vertical=true;this._collections=new Array();this._permissions=new Array();this.currentRow=0;this.currentColumn=0;this.completePublisher=new com.marklogic.events.Publisher();this.controlCount=0;this.fileDrops=new Array();this.fileDropFiles=new Array();this.override=false;this.overrideEndManual=false;this.overrideElementId="";this._uriprefix="/";this.controls=new Array();this.controlData=new Array();this._mode="upload";this._init();};com.marklogic.widgets.create.prototype.addErrorListener=function(fl){this.errorPublisher.subscribe(fl);};com.marklogic.widgets.create.prototype.removeErrorListener=function(fl){this.errorPublisher.unsubscribe(fl);};com.marklogic.widgets.create.prototype._init=function(){var parentel=document.getElementById(this.container);parentel.innerHTML="<div id='"+this.container+"-create' class='mljswidget panel panel-info create'>"+"<div class='panel-heading create-title'>Create a new Document</div>"+"<form id='"+this.container+"-create-form' class='panel-body create-form' role='form'>"+"<div class='create-row' id='"+this.container+"-create-row-0'>"+"<div class='create-col' id='"+this.container+"-create-row-0-col-0' style='float:left;'></div>"+"</div>"+"</form>""</div><div style='";};com.marklogic.widgets.create.prototype._place=function(html,type,id){if(this.override){com.marklogic.widgets.appendHTML(document.getElementById(this.overrideElementId),html);}else{var cid=this.container+"-create-row-"+this.currentRow+"-col-"+this.currentColumn;var cel=document.getElementById(cid);cel.innerHTML=html;if(this.vertical){this.endRow();}else{this.currentColumn++;var h="<div class='create-col' id='"+this.container+"-create-row-"+this.currentRow+"-col-"+this.currentColumn+"' style='float:left;'></div>";com.marklogic.widgets.appendHTML(document.getElementById(this.container+"-create-row-"+this.currentRow),h);}}
if(undefined!=type&&undefined!=id){this.controls.push({type:type,id:id});}};com.marklogic.widgets.create.prototype.endRow=function(){com.marklogic.widgets.appendHTML(document.getElementById(this.container+"-create-row-"+this.currentRow),"<div style='clear:both'></div>");this.currentRow++;this.currentColumn=0;var h="<div class='create-row' id='"+this.container+"-create-row-"+this.currentRow+"'>"+"<div class='create-col' id='"+this.container+"-create-row-"+this.currentRow+"-col-"+this.currentColumn+"' style='float:left;'></div>"+"</div>";com.marklogic.widgets.appendHTML(document.getElementById(this.container+"-create-form"),h);return this;};com.marklogic.widgets.create.prototype.mode=function(newMode){this._mode=newMode;return this;};com.marklogic.widgets.create.prototype.uriPrefix=function(prefix){this._uriprefix=prefix;return this;};com.marklogic.widgets.create.prototype.uriprefix=com.marklogic.widgets.create.prototype.uriPrefix;com.marklogic.widgets.create.prototype.horizontal=function(){this.vertical=false;return this;};com.marklogic.widgets.create.prototype.collectionUser=function(){return this;};com.marklogic.widgets.create.prototype.collection=function(col){this._collections.push(col);return this;};com.marklogic.widgets.create.prototype.dnd=function(){if(window.File&&window.FileReader&&window.FileList&&window.Blob){console.log("File API is supported by this browser");}else{console.log('The File APIs are not fully supported in this browser.');}
var id=this.container+"-dnd-"+ ++this.controlCount;var html="<input type='file' id='"+id+"' class='span2 form-control btn btn-default create-file' />";this._place(html,"dnd",id);var self=this;document.getElementById(id).onchange=function(evt){console.log("file onchange fired");self.controlData[id]={files:evt.target.files};console.log("Saved file data");};return this;};com.marklogic.widgets.create.prototype.forcePermission=function(permObject){this._permissions.push(permObject);return this;};com.marklogic.widgets.create.prototype.permissions=function(allowMultiple,firstRoleArray,title_opt,privilege){if(undefined==privilege){privilege=title_opt;title_opt=undefined;}
var id=this.container+"-permissions-"+(++this.controlCount);var html="<div id='"+id+"' class='input-prepend create-permissions'>";if(undefined!=title_opt){html+="<span for='"+id+"' class='create-select-title'>"+title_opt+"</label> ";}
html+="<select id='"+id+"-select' class='form-control create-select'>";for(var i=0;i<firstRoleArray.length;i++){html+="<option value='"+firstRoleArray[i]+"'>"+firstRoleArray[i]+"</option>";}
html+="</select></div>";this._place(html,"permissions",id);this.controlData[id]={privilege:privilege};return this;};com.marklogic.widgets.create.prototype.bar=function(){var id=this.container+"-bar-"+ ++this.controlCount;var html="<div id='"+id+"' class='create-bar'></div>";this._place(html,"bar",id);this.override=true;this.overrideElementId=id;this.overrideEndManual=true;return this;};com.marklogic.widgets.create.prototype.endBar=function(){this.override=false;this.overrideEndManual=false;this.overrideElementId="";return this;};com.marklogic.widgets.create.prototype.save=function(title_opt){var id=this.container+"-create-save-"+ ++this.controlCount;var title="Save";if(undefined!=title_opt){title=title_opt;}
var html="<button class='btn btn-primary create-save' type='submit' id='"+id+"'>"+title+"</button>";this._place(html,"save",id);var self=this;document.getElementById(this.container+"-create-form").onsubmit=function(){try{self._onSave();}catch(ex){console.log("ERROR ON SAVE: "+ex);}
return false;};return this;};com.marklogic.widgets.create.prototype.addCompleteListener=function(lis){this.completePublisher.subscribe(lis);};com.marklogic.widgets.create.prototype.removeCompleteListener=function(lis){this.completePublisher.unsubscribe(lis);};com.marklogic.widgets.create.prototype._onSave=function(){console.log("onSave called");if("upload"==this._mode){var uploadCtl=null;var perms=new Array();for(var i=0;i<this.controls.length;i++){var ctl=this.controls[i];console.log("control: "+JSON.stringify(ctl));if("dnd"==ctl.type){uploadCtl=ctl;}
if("permissions"==ctl.type){var ctlData=this.controlData[ctl.id];var e=document.getElementById(ctl.id+"-select");perms.push({role:e.value,permission:ctlData.privilege});}}
for(var p=0;p<this._permissions.length;p++){perms.push(this._permissions[p]);}
if(null!=uploadCtl){console.log("got uploadCtl");var files=document.getElementById(uploadCtl.id).files;if(!files.length){alert('Please select a file!');return;}
var file=files[0];var start=0;var stop=file.size-1;var cols="";for(var i=0;i<this._collections.length;i++){if(0!=i){cols+=",";}
cols+=this._collections[i];}
var props={contentType:file.type,format:"binary",collection:cols,permissions:perms}
console.log("mime type: "+file.type);console.log("Request properties: "+JSON.stringify(props));var reader=new FileReader();var self=this;reader.onloadend=function(evt){if(evt.target.readyState==FileReader.DONE){console.log("file content: "+evt.target.result);console.log("calling mljs save");mljs.defaultconnection.save(file,self._uriprefix+file.name,props,function(result){if(result.inError){console.log("ERROR: "+result.doc);}else{console.log("SUCCESS: "+result.docuri);self.completePublisher.publish(result.docuri);}});}};var blob=null;if(file.webkitSlice){blob=file.webkitSlice(start,stop+1);}else if(file.mozSlice){blob=file.mozSlice(start,stop+1);}
reader.readAsArrayBuffer(blob);}else{console.log("upload ctl null");}}else{console.log("unknown mode: "+this._mode);}};