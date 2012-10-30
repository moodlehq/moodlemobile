/*
 *  Text2Pass 1.0
 *	@author	Peter Vahaviolos, http://taledo.com.au
 *	@date 	Mar 20, 2010
 *  @edited	Aprin 2011
 *	@requires	jquery.js
 *
 *	jquery.Text2Pass.js plugin
 *	On load, this script replaces a password field with a temporary text field.
 *  The password field then gets restored once a user focuses that field.
 * 	Can be used on multiple password fields per page, each field is it's own instance.
 *
 *	@example $('.pass').Text2Pass("Enter something");
 *
 */
 
(function($) {
	$.fn.extend({
		Text2Pass: function(myOptions) {
			var options = {
				text: 'Enter Password'		// Placeholder text inside field
			}
			
			$.extend(options, myOptions);
			
			return this.each(function(index) {
				var obj = $(this);
				
				function getValue() {
					return (obj.val() && obj.val()!="") ? obj.val() : options.text
				}
				
				// Common input attributes to preserve. Add or delete attributes as desired
				var attributes = [
					"id","align","disabled","maxlength","readonly","size","class","accesskey","tabindex","dir","lang","style","value","title","xml:lang","onblur","onchange","onclick","ondblclick","onfocus","onmousedown","onmousemove","onmouseout","onmouseover","onmouseup","onkeydown","onkeypress","onkeyup","onselect" 
				]
										
				var newInput = $("<input />");
				
				//Retrive element attributes and add them to our new input placeholder
				for(attribute in attributes){
					
					
					if($(this).attr(attributes[attribute]) != "undefined" && $(this).attr(attributes[attribute]) != -1){
						$(newInput).attr(
							attributes[attribute], 
							$(this).attr(attributes[attribute])
						);
					}
				}
				
				newInput.attr({ 
					type: "text",
					value: getValue()
				})
				
				//Events
				newInput.bind({
					"focusin": function(event) {
						$(this).replaceWith(obj);
						obj.val("").focus().focus() //2nd focus for IE
					}
				})

				$(this).replaceWith(newInput);
			});
		}
	});

})(jQuery);