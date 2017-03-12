/**
 * @fileOverview Payture.js is library to use in Payture paying templates
 * @version 1.2
 */

/**
 * Main class
 *
 * @namespace
 * @class
*/
var Payture = {
	/**
	 * Object, that contains default properties and flags
	 *
	 * @namespace
	 * @static
	 * @type {Object}
	 * @property {string} [Type=Default] Type of template - "Default" or "JSON"
	 * @property {string} [TypeAPI=InPay] Type of API - "InPay" or "eWallet"
	 * @property {string} [Action=PaySubmit] Type of action - "PaySubmit" or "AddSubmit"
	 * @property {string} [Event=submit #payForm] Send form event
	 * @property {string} [RemoveEvent=click #removeCard] Remove card event
	 * @property {string} [TopErrorContainer=#errorTop) Container ID for errors text in JSON template
	 * @property {string} [PaymentKey] Merchant Payment Key for delete Card
	 * @property {boolean} [DetectDevice=true] Detect Tablet or Mobile
	 * @property {boolean} [CheckNumbers=true] Check numbers in inputs
	 * @property {boolean} [CheckLetters=true] Check characters in Card Holder field
	 * @property {boolean} [DetectCardType=true] Detect card type - Visa or MasterCard
	 * @property {boolean} [DisableButton=true] Disable button if required fields are not filled
	 * @property {boolean} [GroupCardNumber=true] Change caret (desktop) or group Card Number (mobile and tablet)
	 * @property {boolean} [ResizeCardNumberInput=false] Resize card number field for 19-digits number
	 * @property {boolean} [HideCardList=true] Hide card list if card list is empty
	 * @property {boolean} [MasterPass=false] Use MasterPass
	 * @property {boolean} [MasterPassUseCVV=false] Use MasterPass
	 */
	defaults : {
		Type 		: "Default",
		TypeAPI		: "InPay",
		Action 		: "PaySubmit",
		Event 		: "submit #payForm",
		RemoveEvent : "click #removeCard",
		TopErrorContainer : "#errorTop",
		PaymentKey	: "",
		MasterPass  : false,
		MasterPassUseCVV : false,
		Inbox		: false,
		
		// Options
		DetectDevice : true,
		CheckNumbers : true,
		CheckLetters : true,
		DetectCardType : true,
		DisableButton : true,
		GroupCardNumber : true,
		ResizeCardNumberInput : false,
		HideCardList : true,

		/**
		 * @private
		 * @type {boolean}
		 */
		MasterPassRedirected : false,
		/**
		 * @private
		 * @type {boolean}
		 */
		IsMobile : false,
		/**
		 * @private
		 * @type {boolean}
		 */
		IsTablet : false,

		/**
		 * Data object with jQuery set of fields elements
		 *
		 * @static
		 * @type {Object}
		 * @property {Array} Data.CardNumber
		 * @property {Object} Data.EMonth
		 * @property {Object} Data.EYear
		 * @property {Object} Data.CardHolder
		 * @property {Object} Data.SecureCode
		 */
		Data : {
			CardNumber : [$("input[name=CardNumber0]"), $("input[name=CardNumber1]"), $("input[name=CardNumber2]"), $("input[name=CardNumber3]")],
			EMonth : $("input[name=EMonth]"),
			EYear : $("input[name=EYear]"),
			CardHolder : $("input[name=CardHolder]"),
			SecureCode : $("input[name=SecureCode]")
		},

		/**
		 * Errors texts templates
		 *
		 * @static
		 * @type {Object}
		 * @property {string} TemplateErrors.EmptyPan
		 * @property {string} TemplateErrors.EmptyDate
		 * @property {string} TemplateErrors.EmptyMonth
		 * @property {string} TemplateErrors.EmptyYear
		 * @property {string} TemplateErrors.WrongDate
		 * @property {string} TemplateErrors.EmptyCardHolder
		 * @property {string} TemplateErrors.EmptyCVV
		 */
		TemplateErrors : {
			EmptyPan	: "Введите от 16 до 19 знаков номера карты",
			EmptyDate	: "Укажите дату, до которой действительна карта",
			EmptyMonth	: "Укажите месяц, до которого действительна карта",
			EmptyYear	: "Укажите год, до которого действительна карта",
			WrongDate	: "Неверно указана дата",
			EmptyCardHolder : "Укажите имя владельца карты",
			EmptyCVV	: "Укажите код CVV"
		},

		/**
		 * Server errors texts
		 *
		 * @static
		 * @type {Object}
		 */
		ServerErrors : {
			'default'		: 'К сожалению, в настоящее время платеж с данной карты невозможен. Попробуйте оплатить другой картой',
			AMOUNT_EXCEED 	: 'К сожалению, в настоящее время платеж с данной карты невозможен. Cвяжитесь со своим банком и попробуйте еще раз, либо воспользуйтесь другой картой',
			AMOUNT_EXCEED_BALANCE	: 'К сожалению, в настоящее время платеж с данной карты невозможен. Cвяжитесь со своим банком и попробуйте еще раз, либо воспользуйтесь другой картой',
			AUTHENTICATION_ERROR	: 'К сожалению, в настоящее время платеж с данной карты невозможен. Cвяжитесь со своим банком и попробуйте еще раз, либо воспользуйтесь другой картой',
			AUTHORIZATION_TIMEOUT	: 'К сожалению, в настоящее время платеж с данной карты невозможен. Cвяжитесь со своим банком и попробуйте еще раз, либо воспользуйтесь другой картой',
			COMMUNICATE_ERROR	: 'Ошибка возникла при передаче данных в МПС. Повторите попытку',
			DUPLICATE_ORDER_ID	: 'Номер заказа уже использовался ранее. Оформите новый заказ',
			FRAUD_ERROR 		: 'К сожалению, в настоящее время платеж с данной карты невозможен. Попробуйте оплатить другой',
			FRAUD_ERROR_CRITICAL_CARD : 'К сожалению, в настоящее время платеж с данной карты невозможен. Попробуйте оплатить другой',
			ILLEGAL_ORDER_STATE	: 'К сожалению, в настоящее время платеж с данной карты невозможен. Попробуйте оплатить другой',
			ISSUER_BLOCKED_CARD	: 'К сожалению, в настоящее время платеж с данной карты невозможен. Cвяжитесь со своим банком и попробуйте еще раз, либо воспользуйтесь другой картой',
			ISSUER_CARD_FAIL	: 'К сожалению, в настоящее время платеж с данной карты невозможен. Cвяжитесь со своим банком и попробуйте еще раз, либо воспользуйтесь другой картой',
			ISSUER_FAIL 		: 'К сожалению, в настоящее время платеж с данной карты невозможен. Cвяжитесь со своим банком и попробуйте еще раз, либо воспользуйтесь другой картой',
			ISSUER_LIMIT_AMOUNT_FAIL : 'Предпринята попытка выполнить транзакцию на сумму, превышающую лимит, заданный банком, выпустившим карту. Измените лимит и повторите попытку',
			ISSUER_LIMIT_COUNT_FAIL	 : 'Превышен лимит на число транзакций, заданный банком, выпустившим карту. Измените лимит и повторите попытку',
			ISSUER_LIMIT_FAIL 	: 'Предпринята попытка, превышающая ограничения, заданные банком, выпустившим карту, на сумму или количество операций в определенный промежуток времени. Измените ограничения и повторите попытку',
			ISSUER_TIMEOUT		: 'Нет связи с банком, выпустившим карту. Повторите попытку, либо воспользуйтесь другой картой',
			MERCHANT_RESTRICTION : 'К сожалению, в настоящее время платеж с данной карты невозможен. Попробуйте оплатить другой',
			PROCESSING_ERROR	: 'К сожалению, в настоящее время платеж с данной карты невозможен. Cвяжитесь со своим банком и попробуйте еще раз, либо воспользуйтесь другой картой',
			LIMIT_EXCHAUST	: 'Время, отведенное для ввода данных, исчерпано. Оформите новый заказ',
			ORDER_TIME_OUT	: 'Время платежа (сессии) истекло. Оформите новый заказ',
			WRONG_CARD_PAN	: 'Неверный номер карты. Повторите ввод данных',
			WRONG_CARD_INFO	: 'Неверные параметры карты. Повторите ввод данных',
			WRONG_PARAMS	: 'Неверные параметры карты. Повторите ввод данных'
		},

		/**
		 * Additional function before submit form
		 * @method
		 */
		onBeforeSubmit : null,
		/**
		 * Rewrite function for change card
		 * @method
		 */
		onSelectCard : null,
		/**
		 * Rewrite function for actions after remove card
		 * @method
		 */
		onRemoveCard : null,
		/**
		 * Rewrite function for show errors
		 * @method
		 */
		onShowErrors : null,
		/**
		 * Rewrite function for hide errors
		 * @method
		 */
		onHideErrors : null,
		/**
		 * Function for success action if JSON template
		 *
		 * @param {string} redirectUrl
		 */
		onSuccess : function (redirectUrl) {
			$("form button").removeClass("loading").removeAttr("disabled");
			$(".loader").hide();
			$(".section").hide();
			$("#result").show();
			$("#result h3").text("Оплата прошла успешно!");
			$("#result a").attr("href", redirectUrl);
			setTimeout(function () { window.location.href = redirectUrl; }, 2000);
		},
		/**
		 * Function for error action if JSON template
		 *
		 * @param {string} errorCode
		 * @param {boolean} canRetry
		 * @param {string} redirectUrl
		 * @param {string} key
		 */
		onError : function (errorCode, canRetry, redirectUrl, key) {
			$("form button").removeClass("loading").removeAttr("disabled");
			$(".loader").hide();

			if (!canRetry) {
				$(".section").hide();
				$("#result").show();
				$("#result h3").text("Оплата не прошла!");
				$("#result .message").text(Payture.options.ServerErrors[errorCode]);
				$("#result a").attr("href", redirectUrl);
				setTimeout(function () { window.location.href = redirectUrl; }, 2000);
			} else
				$(Payture.options.TopErrorContainer).text(Payture.options.ServerErrors[errorCode]);
		}
	},
	/**
	 * Object, that contains mapping between english and russian letters
	 *
	 * @static
	 * @type {Object}
	 */
	enToRu : {
		'й' : 'q', 'ц' : 'w', 'у' : 'e', 'к' : 'r', 'е' : 't', 'н' : 'y', 'г' : 'u', 'ш' : 'i', 'щ' : 'o', 'з' : 'p',
		'ф' : 'a', 'ы' : 's', 'в' : 'd', 'а' : 'f', 'п' : 'g', 'р' : 'h', 'о' : 'j', 'л' : 'k', 'д' : 'l',
		'я' : 'z', 'ч' : 'x', 'с' : 'c', 'м' : 'v', 'и' : 'b', 'т' : 'n', 'ь' : 'm'
	},
	/**
	 * Object, that contains test with common regexps
	 *
	 * @namespace
	 * @static
	 * @type {Object}
	 */
	regexp : {
		/**
		 * @param {Number|String} cCode
		 * @returns {boolean}
		 */
		isNumber : function (cCode) { return /[0-9]/.test(String.fromCharCode(cCode)); },
		/**
		 * @param {Number|String} cCode
		 * @returns {boolean}
		 */
		isPan : function  (cCode) { return /3|4|5|6/.test(String.fromCharCode(cCode)); }
	},
	/**
	 * Empty object for filling with options after initialization
	 *
	 * @static
	 * @type {Object}
	 */
	options : {},
	/**
	 * @typedef {Object} FormValues
	 * @property {String} [CardNumber]
	 * @property {Number} [EMonth]
	 * @property {Number} [EYear]
	 * @property {String} [CardHolder]
	 * @property {Number} [SecureCode]
	 * @property {String} [CardId] - when eWallet used
	 * @property {Boolean} [AddCard] - when eWallet used
	 * @property {String} [oauth_Token] - when MasterPass used
	 */
	/**
	 * Pay in InPay Interface
	 *
	 * @param {Object} params - Custom options
	 */
	InPay : function (params) {
		Payture.commonInit(params, "InPay", {
			CardNumber : [$("input[name=CardNumber0]"), $("input[name=CardNumber1]"), $("input[name=CardNumber2]"), $("input[name=CardNumber3]")],
			EMonth : $("input[name=EMonth]"),
			EYear : $("input[name=EYear]"),
			CardHolder : $("input[name=CardHolder]"),
			SecureCode : $("input[name=SecureCode]")
		});

		$("html " + Payture.options.Event.split(" ")[1]).bind(Payture.options.Event.split(" ")[0], function () {
			if (Payture.options.onBeforeSubmit != null)
				Payture.options.onBeforeSubmit();

			$("form button").addClass("loading").attr("disabled", true);
			if(Payture.options.MasterPass && Payture.options.MasterPassRedirected){
				Payture.Pay({
					Type: "MP",
					Key: $("input[name=Key]").val(),
					Card: Payture.getFormValues({
						SecureCode : $("input[name=SecureCode]"),
						oauth_Token: $("input[name=oauth_Token]")
					})
				});
			} else {
				Payture.Pay({
					Type : Payture.options.Type,
					TypeAPI : "InPay",
					Key : $("input[name=Key]").val(),
					Card : Payture.getFormValues(Payture.options.Data)
				});
			}
			return false;
		});
	},
	/**
	 * Pay in eWallet Interface
	 *
	 * @param {Object} params - custom options
	 */
	eWalletPay : function (params) {
		Payture.commonInit(params, "eWallet", {
			CardId : $("select[name=CardId]"),
			CardNumber : [$("input[name=CardNumber0]"), $("input[name=CardNumber1]"), $("input[name=CardNumber2]"), $("input[name=CardNumber3]")],
			EMonth : $("input[name=EMonth]"),
			EYear : $("input[name=EYear]"),
			CardHolder : $("input[name=CardHolder]"),
			SecureCode : $("input[name=SecureCode]"),
			AddCard : $("input[name=AddCard]")
		});

		$("html " + Payture.options.Event.split(" ")[1]).bind(Payture.options.Event.split(" ")[0], function () {
			if (Payture.options.onBeforeSubmit != null) {
				Payture.options.onBeforeSubmit();
			}

			$("form button").addClass("loading").attr("disabled", true);
			if(Payture.options.MasterPass && Payture.options.MasterPassRedirected){
				Payture.Pay({
					Type: "MP",
					Key: $("input[name=Key]").val(),
					Card: Payture.getFormValues({
						CardId : $("select[name=CardId]"),
						SecureCode : $("input[name=SecureCode]"),
						oauth_Token: $("input[name=oauth_Token]"),
						AddCard : $("input[name=AddCard]")
					})
				});
			} else {
				Payture.Pay({
					Type: Payture.options.Type,
					TypeAPI: "eWallet",
					Key: $("input[name=Key]").val(),
					Card: Payture.getFormValues(Payture.options.Data)
				});
			}
			return false;
		});

		$("html " + Payture.options.RemoveEvent.split(" ")[1]).bind(Payture.options.RemoveEvent.split(" ")[0], function () {
			if (Payture.options.PaymentKey != "" && $(Payture.options.Data.CardId).val() != "FreePay" && $(Payture.options.Data.CardId).val() != "")
				Payture.RemoveCard({ CardId : $(Payture.options.Data.CardId).val(), PaymentKey : Payture.options.PaymentKey })
			return false;
		});
	},
	/**
	 * Add card in eWallet Interface
	 *
	 * @param {Object} params - custom options
	 */
	eWalletAdd : function (params) {
		Payture.commonInit(params, "eWallet", {
			CardNumber : [$("input[name=CardNumber0]"), $("input[name=CardNumber1]"), $("input[name=CardNumber2]"), $("input[name=CardNumber3]")],
			EMonth : $("input[name=EMonth]"),
			EYear : $("input[name=EYear]"),
			CardHolder : $("input[name=CardHolder]"),
			SecureCode : $("input[name=SecureCode]")
		});

		$("html " + Payture.options.Event.split(" ")[1]).bind(Payture.options.Event.split(" ")[0], function () {
			if (Payture.options.onBeforeSubmit != null)
				Payture.options.onBeforeSubmit();

			$("form button").addClass("loading").attr("disabled", true);
			Payture.Add({
				Type : Payture.options.Type,
				Key : $("input[name=Key]").val(),
				Card : Payture.getFormValues(Payture.options.Data)
			});
			return false;
		});
	},
	/**
	 * Pay card in Inpay and eWallet interfaces
	 *
	 * @param {Object} params
	 * @param {string} params.Type
	 * @param {string} [params.TypeAPI]
	 * @param {string} params.Key
	 * @param {FormValues} params.Card
	 * @param {function} [params.onSuccess]
	 * @param {function} [params.onError]
	 */
	Pay : function (params) {
		if (!params.onSuccess && params.Type == "JSON")
			params.onSuccess = Payture.options.onSuccess;
		if (!params.onError && params.Type == "JSON")
			params.onError = Payture.options.onError;
		
		if (params.Type == "Default") Payture.submitForm("PaySubmit", Payture.inlineData(params.Key, params.Card));
		else if (params.Type == "MP") Payture.submitForm("PaySubmitMP", Payture.inlineData(params.Key, params.Card));
		else if (params.Type == "JSON") Payture.submitFormJSON("PaySubmit", params.TypeAPI, Payture.inlineData(params.Key, params.Card), params.onSuccess, params.onError);
	},
	/**
	 * Add card in eWallet interface
	 *
	 * @param {Object} params
	 * @param {string} params.Type
	 * @param {string} params.Key
	 * @param {FormValues} params.Card
	 * @param {function} [params.onSuccess]
	 * @param {function} [params.onError]
	 */
	Add : function (params) {
		if (!params.onSuccess && params.Type == "JSON")
			params.onSuccess = Payture.options.onSuccess;
		if (!params.onError && params.Type == "JSON")
			params.onError = Payture.options.onError;
		
		if (params.Type == "Default") Payture.submitForm("AddSubmit", Payture.inlineData(params.Key, params.Card));
		else if (params.Type == "JSON") Payture.submitFormJSON("AddSubmit", "eWallet", Payture.inlineData(params.Key, params.Card), params.onSuccess, params.onError);
	},
	/**
	 * Validate field value
	 *
	 * @param {Object} params
	 * @param {string} params.Name
	 * @param {string} params.Value
	 * @return {validationData|null}
	 */
	Validate : function (params) { return Payture.validationData[params.Name] ? Payture.validationData[params.Name](params.Value) : null; },
	/**
	 * Get extended card list
	 *
	 * @return {CardList} Card list
	 */
	GetCardList : function () {
		var CardList = {};
		if (CardPANS && CardPANS.length != 0) {
			$.each(CardPANS, function (index, value) {
				/**
				 * @typedef {Object} CardList
				 * @property {number} Id
				 * @property {boolean} NoCVV
				 * @property {boolean} Expired
				 * @property {Date} LastPay
				 */
				CardList[value] = {
					Id : index,
					NoCVV : CardNoCVVInfo && CardNoCVVInfo[index] ? CardNoCVVInfo[index] : undefined,
					Expired : CardExpiredInfo && CardExpiredInfo[index] ? CardExpiredInfo[index] : undefined,
					LastPay : CardLastSuccess && CardLastSuccess[index] ? new Date(CardLastSuccess[index]) : undefined
				}
			});
		}
		return CardList;
	},
	/**
	 * Validate field value
	 *
	 * @param {Object} params
	 * @param {string} params.CardId
	 * @param {string} params.PaymentKey
	 * @param {string} [params.onRemove]
	 */
	RemoveCard : function (params) {
		$.ajax({
			type : "GET",
			url : "/vwapi/Remove2?CardId=" + params.CardId + "&VWID=" + params.PaymentKey,
			timeout : 30000,
			success : function (data) {
				var response = Payture.xmlToString(data);
				if (response.indexOf('Success="True"') != -1) {
					if (params.onRemove && params.onRemove !== null) params.onRemove(params.CardId);
					else Payture.updateList(params.CardId);
				} 
			},
			error : function () {
				alert("Произошла ошибка");
			}
		});
	},
	/**
	 * Validate field value
	 *
	 * @param {String} key
	 * @param {Int} paymentType
	 * @param {Function} callbackSuccess
	 * @param {Function} callbackError
	 */
	GetState : function (key, paymentType, callbackSuccess, callbackError) {
		Payture.Timeout += 30000;
		$.ajax({
			type : "POST",
			url : "/ncapi/GetState",
			data : {
				Key : key,
				NoCardPaymentType : paymentType,
				CompileRedirectURL : true
			},
			timeout : 30000,
			success : function (data) {
				if (data.Success && data.State == "Charged") {
					if (callbackSuccess)
						callbackSuccess(data.ReturnUrl);
				} else if (data.Success && data.State == "Authorized" && Payture.Timeout < 600000) {
					setTimeout(function () {
						Payture.GetState(key, paymentType, callbackSuccess, callbackError);
					}, 30000);
				} else {
					if (callbackError)
						callbackError(data.ErrCode, false, data.ReturnUrl)
				}
				
			},
			error : function () {
				alert("Произошла ошибка");
			}
		});
	},
	/**
	 * Common initialize for all methods
	 *
	 * @param {Object} params - init params
	 * @param {String} typeAPI
	 * @param {Object} data - default data params
	 */
	commonInit : function (params, typeAPI, data) {
	 	if (!params)
			params = {};
		Payture.options = $.extend({}, Payture.defaults, params);
		Payture.options.TypeAPI = typeAPI;

		if (!params.Data)
			Payture.options.Data = data;

		if (params.TemplateErrors)
			Payture.options.TemplateErrors = $.extend(Payture.defaults.TemplateErrors, params.TemplateErrors);

		if (params.ServerErrors)
			Payture.options.ServerErrors = $.extend(Payture.defaults.TemplateErrors, params.ServerErrors);

		$(".section").hide();
		if (Payture.options.Inbox) {
			$("#paymentType").show();
			Payture.inboxActions();
		} else $("#paymentCard").show();

		if (Payture.options.Type == "JSON" && !$.isEmptyObject(Payture.getJSONResponse())) {
			Payture.options.onError(
				Payture.getJSONResponse().ErrCode,
				Payture.getJSONResponse().CanRetry,
				Payture.getJSONResponse().RedirectUrl
			);
		}

		if (Payture.options.DetectDevice)
			Payture.detectingDevice();

		Payture.formActions();

		if (Payture.options.MasterPass)
			Payture.MasterPass();
	},
	/** 
	 * Update Card List after removing card
	 *
	 * @param {string} cardId - Removed Card Id
	 */
	updateList : function (cardId) {
		if (Payture.options.onRemoveCard !== null)
			Payture.options.onRemoveCard(cardId);
		else {
			$(Payture.options.Data.CardId).find("option[value=" + cardId + "]").remove();
			if (Payture.options.HideCardList && Payture.options.TypeAPI == "eWallet")
				Payture.hideCardList();
			
			Payture.changeCard($(Payture.options.Data.CardId).val(), $(Payture.options.Data.CardId).find("option:selected").text());
		}
	},
	/** 
	 * Generate links for different payment types
	 */
	getPayLinks : function () {
		var data = "Key=" + $("input[name=Key]").val() + ";isNoCard=true;NoCardPaymentType=",
			location = window.location;
		$("#paymentType a:not(.payCard)").each(function () {
			$(this).attr("href", location.protocol + "//" + location.host + "/apim/PaySubmit/?Data=" + encodeURIComponent(data + $(this).attr("rel")));
		});
	},
	/**
	 * Set new key after JSON error
	 *
	 * @param {String} key
	 */
	setNewKey : function (key) { $("input[name=Key]").val(key); },
	/**
	 * Detecting device - tablet or mobile
	 */
	detectingDevice : function () {
		Payture.options.IsTablet = device.tablet();
		Payture.options.IsMobile = device.mobile();
	},
	/**
	 * Parse JSON resoponse on templates
	 * @return {Object} response
	 */
	getJSONResponse : function () {
		var responseJSON = $(".response_json").text();
		return responseJSON.indexOf('{response_json}') == -1 && responseJSON != "" ? eval ('(' + responseJSON + ')') : {};
	},
	inboxActions : function () {
		Payture.getPayLinks();
		$("#paymentType a").click(function () {
			if ($(this).is(".payCard")) {
				$(".section").hide();
				$("#paymentCard").show();
				return false;
			} else {
				$(".loader").fadeIn(150);
				Payture.NoCardPaymentType = $(this).attr("rel");
				Payture.Timeout = 0;
				setTimeout(function () {
					Payture.GetState($("input[name=Key]").val(), Payture.NoCardPaymentType, Payture.options.onSuccess, Payture.options.onError);
				}, 30000);
			}
		});

		$("#reset").click(function () {
			$(".loader").hide();
			Payture.NoCardPaymentType = undefined;
			Payture.Timeout = 0;
		});

		$("#toBack").click(function () {
			$(".section").hide();
			$("#paymentType").show();
			return false;
		});
	},
	/**
	 * Actions with inputs:<br/>
	 * &nbsp;   Disable buttons<br/>
	 * &nbsp;   Select card type<br/>
	 * &nbsp;   Resize card number input<br/>
	 * &nbsp;   Validate charapters on KEYPRESS<br/>
	 * &nbsp;   Change caret position or grouping number on KEYUP<br/>
	 * &nbsp;   Validate values end show errors on BLUR<br/>
	 */
	formActions : function () {
		if (Payture.options.DisableButton)
			Payture.checkButton();
		if (Payture.options.DetectCardType)
			Payture.selectCardType(Payture.getPAN(Payture.options.Data.CardNumber));
		if (Payture.options.ResizeCardNumberInput && !Payture.options.IsMobile && !Payture.options.IsTablet)
			Payture.resizeInput();
		if (Payture.options.HideCardList && Payture.options.TypeAPI == "eWallet")
			Payture.hideCardList();

		var focusElement = "";
		$("*").focus(function () {
			focusElement = Payture.defineFieldType(this);
		});


		$("html input").bind({
			keypress : function (event) {
				Payture.hideErrors($(this));
				if ($(this).is(".onlyNum") && Payture.options.CheckNumbers) return Payture.checkChar(event, "isNumber");
				if ($(this).is(".onlyLat") && Payture.options.CheckLetters) return Payture.translateText(event, this);
			},
			keyup : function (event) {
				if (Payture.options.DetectCardType && Payture.defineFieldType($(event.currentTarget)) == "CardNumber")
					Payture.selectCardType(Payture.getPAN(Payture.options.Data.CardNumber));
				if (Payture.options.DisableButton)
					Payture.checkButton();
				if (Payture.options.ResizeCardNumberInput && !Payture.options.IsMobile && !Payture.options.IsTablet && Payture.defineFieldType($(event.currentTarget)) == "CardNumber")
					Payture.resizeInput();

				if (Payture.options.GroupCardNumber) {
					var element = Payture.defineFieldType($(event.currentTarget));
					if (element == "CardNumber" && (!Array.isArray(element) || Payture.options.IsMobile || Payture.options.IsTablet))
						Payture.separatingNumber(event, this);
					
					if (!Payture.options.IsTablet && !Payture.options.IsMobile)
						Payture.changeCaretPosition(event, this);
				}
			},
			blur : function (event) {
				if (Payture.options.IsMobile)
					$.each(Payture.options.Data, function (index, value) { Payture.hideErrors(value); });
				
				setTimeout(function() {
					if (Payture.defineFieldType($(event.currentTarget)) != focusElement) {
						Payture.showErrors(Payture.Validate({
							Name : Payture.defineFieldType($(event.currentTarget)), 
							Value : Payture.getFormValues(Payture.options.Data)[Payture.defineFieldType($(event.currentTarget))]
						}));
					}
				}, 10);
			}
		});
	},
	/**
	 * Hide card list if no options
	 */
	hideCardList : function () {
		if ($(Payture.options.Data.CardId).length > 0 && $(Payture.options.Data.CardId).find("option").length < 2)
			$(".selectCard").hide();
		else
			$(".selectCard").show();
	},
	/**
	 * Set card parameters on change card
	 *
	 * @param {string} cardId
	 * @param {string} cardMask
	 */
	changeCard : function (cardId, cardMask) {
		if (Payture.options.onSelectCard !== null)
			Payture.options.onSelectCard(cardId, cardMask);
		else {
			if (cardId == "FreePay") {
				$.each(Payture.options.Data, function (index, value) {
					if (Array.isArray(value)) {
						$.each(value, function (i, v) {
							$(v).val("").removeAttr("disabled");
						})
					} else if ($(value).is("input")) {
						$(value).val("").removeAttr("disabled");
					}
				});
				$("#addCard").show().find("input").removeAttr("disabled");
				$("html " + Payture.options.RemoveEvent.split(" ")[1]).hide();
			} else {
				Payture.showCardStub(cardMask, true);
				$("#addCard").hide().find("input").attr("disabled", true);
				$("html " + Payture.options.RemoveEvent.split(" ")[1]).show();
			}
			$.each(Payture.options.Data, function (index, value) { Payture.hideErrors(value); });
		}
	},
	/**
	 * Get form values
	 *
	 * @param {Object} data - object of elements
	 * @return {FormValues} values
	 */
	getFormValues : function (data) {
		var values = {};
		$.each(data, function (index, value) {
			if (Array.isArray(value)) {
				if ($(value[0]).is(":disabled"))
					return true;
				values[index] = Payture.getPAN(value);
			} else if ($(value).is(":input")) {
				if ($(value).is(":disabled"))
					return true;
				values[index] = $(value).val();
				if (index == "EMonth") values[index] = Payture.addValue($(value).val());
				if (index == "CardNumber" && (Payture.options.IsMobile || Payture.options.IsTablet)) values[index] = $(value).val().replace(/\s/g, "");
				if (index == "AddCard") values[index] = $(value).is(":checked") ? "True" : "";
			} else if (typeof(value) == "function" || typeof(value) == "string") {
				values[index] = value;
			}
		});
		return values;
	},
	/**
	 * Define field name
	 *
	 * @param {HTMLElement} element
	 * @return {String} name
	 */
	defineFieldType : function (element) {
		var name = "";
		$.each(Payture.options.Data, function (index, value) {
			if (Array.isArray(value)) {
				$.each(value, function () {
					if ($(this).is(element)) name = index;
				})
			} else if ($(this).is("input"))
				if ($(value).is(element)) name = index;
		});
		return name;
	},
	/**
	 * Get full PAN
	 *
	 * @param {HTMLElement[]} elements
	 * @return {String} pan - full PAN
	 */
	getPAN : function (elements) { return $.map(elements, function (i) { return $(i).val(); }).join(""); },
	/**
	 * Inline payment data
	 *
	 * @param {String} key - parameter Key
	 * @param {Object} cardData - card payment data
	 * @return {String} stringified payment data
	 */
	inlineData : function (key, cardData) { 
		return "Key=" + key + ";" + $.map(cardData, function (value, index) { return index + "=" + value; }).join(";"); 
	},
	/**
	 * Send Data
	 *
	 * @param {String} action - type of action - PaySubmit or AddSubmit
	 * @param {String} data - inlined data
	 */
	submitForm : function (action, data) {
		var newForm = $("<form></form>").attr({
			method : "POST",
			action : action
		});
		newForm.appendTo($("body"));
		$("<input />").attr({
			type : "hidden",
			name : "Data"
		}).appendTo(newForm).val(data);
		newForm.submit();
	},
	/**
	 * Send Data
	 *
	 * @param {String} action
	 * @param {String} api - type of API - InPay or eWallet
	 * @param {String} data - payment data
	 * @param {Function} callbackSuccess - success callback function
	 * @param {Function} callbackError - error callback function
	 */
	submitFormJSON : function (action, api, data, callbackSuccess, callbackError) {
		$.ajax({
			type : "POST",
			url : (api == "InPay" ? "/apim/" : "/vwapi/") + action,
			data : {
				Data : data,
				Json : true
			},
			timeout : 30000,
			/**
			 * @ignore
			 * @param data
			 * @param {String} data.ErrCode
			 * @param {String} data.RedirectUrl
			 * @param {Boolean} data.Success
			 * @param {Boolean} data.CanRetry
			 * @param {String} data.Key
			 * @param {Object} data.AddInfo
			 * @param {String} data.ACSUrl
			 * @param {String} data.TermUrl
			 * @param {String} data.ThreeDSKey
			 * @param {String} data.PaReq
			 */
			success : function (data) {
				$("form button").removeClass("loading").removeAttr("disabled");
				if (data.ACSUrl)
					Payture.submitForm3DS(data.ACSUrl, data.TermUrl, data.ThreeDSKey, data.PaReq);
				else if (data.Success) {
					if (callbackSuccess)
						callbackSuccess(data.RedirectUrl);
				} else {
					Payture.setNewKey(data.Key);
					if (callbackError)
						callbackError(data.ErrCode, data.CanRetry, data.RedirectUrl, data.Key);
				}
			},
			error : function () {
				alert("Произошла ошибка");
			}
		});
	},
	/**
	 * Submit 3DS form
	 *
	 * @param {String} acsUrl
	 * @param {String} termUrl
	 * @param {String} md
	 * @param {String} paReq
	 */
	submitForm3DS : function (acsUrl, termUrl, md, paReq) {
		var form = $("<form name='form' action='" + acsUrl + "' method='post'>"
			 + "<input type='hidden' name='TermUrl' value='" + termUrl + "'>" 
			 + "<input type='hidden' name='MD' value='" + md + "'>" 
			 + "<input type='hidden' name='PaReq' value='" + paReq + "'>" + 
			 "</form>").appendTo($("body"));

		form.submit();
	},
	/**
	 * Object, containing functions for field validating
	 *
	 * @namespace
	 * @static
	 * @type {Object}
	 */
	validationData : {
		/**
		 * Validating Card Number
		 *
		 * @param {String} cardNumber
		 * @returns {validationResult}
		 */
		CardNumber : function (cardNumber) {
			return {
				Success : cardNumber.length > 15,
				ErrorMessage : Payture.options.TemplateErrors.EmptyPan,
				Element : "CardNumber"
			}
		},
		/**
		 * Validating Card Number
		 *
		 * @param {String} cardNumber
		 * @returns {validationResult}
		 */
		CardTo : function (cardNumber) {
			return {
				Success : cardNumber.length > 15,
				ErrorMessage : Payture.options.TemplateErrors.EmptyPan,
				Element : "CardTo"
			}
		},
		/**
		 * Validating Month in expire date
		 *
		 * @param {String} eMonth
		 * @returns {validationResult}
		 */
		EMonth : function (eMonth) {
			if (eMonth.toLowerCase() == "xx") {
				return {
					Success : true
				}
			}
			var eYear = Payture.getFormValues(Payture.options.Data).EYear;
			if (eMonth == "" || eMonth == "00") {
				if (eYear == "")
					return Payture.validationData.ExpiredDate(eMonth, eYear);
				return {
					Success : eMonth != "" && eMonth != "00" ,
					// ErrorMessage : eYear == "" ? Payture.options.TemplateErrors.EmptyDate : Payture.options.TemplateErrors.EmptyMonth,
					ErrorMessage : Payture.options.TemplateErrors.EmptyMonth,
					Element : "EYear"
				}
			} else if (eYear == "")
				return {
					Success : eMonth != "" && eMonth != "00",
					ErrorMessage : Payture.options.TemplateErrors.EmptyMonth,
					Element : "EYear"
				};
			else
				return Payture.validationData.ExpiredDate(eMonth, eYear);
		},
		/**
		 * Validating Year in expire date
		 *
		 * @param {String} eYear
		 * @returns {validationResult}
		 */
		EYear : function (eYear) {
			if (eYear.toLowerCase() == "xx") {
				return {
					Success : true
				}
			}
			var eMonth = Payture.getFormValues(Payture.options.Data).EMonth;
			if (eYear == "" || eYear == "00") {
				if (eMonth == "")
					return Payture.validationData.ExpiredDate(eMonth, eYear);
				return {
					Success : eYear != "" && eYear != "00",
					ErrorMessage : Payture.options.TemplateErrors.EmptyYear,
					// ErrorMessage : eMonth == "" ? Payture.options.TemplateErrors.EmptyDate : Payture.options.TemplateErrors.EmptyYear,
					Element : "EYear"
				}
			} else if (eMonth == "")
				return Payture.validationData.EMonth(eMonth);
			else
				return Payture.validationData.ExpiredDate(eMonth, eYear);

		},
		/**
		 * Validating whole expire date
		 *
		 * @param {String} eMonth
		 * @param {String} eYear
		 * @returns {validationResult}
		 */
		ExpiredDate : function (eMonth, eYear) {
			var date = new Date(),
				today = date.getFullYear()*100 + date.getMonth() + 1,
				expDate = (2000 + eYear*1)*100 + eMonth*1;
				
			return {
				Success : expDate >= today && eMonth*1 < 13,
				ErrorMessage : Payture.options.TemplateErrors.WrongDate,
				Element : "EYear"
			}
		},
		/**
		 * Validating Card Holder name
		 *
		 * @param {String} cardHolder
		 * @returns {validationResult}
		 */
		CardHolder : function (cardHolder) {
			return {
				Success : cardHolder.length > 2,
				ErrorMessage : Payture.options.TemplateErrors.EmptyCardHolder,
				Element : "CardHolder"
			}
		},
		/**
		 * Validating CVV
		 *
		 * @param {String} cvv
		 * @returns {validationResult}
		 */
		SecureCode : function (cvv) {
			return {
				Success : cvv.length == 3,
				ErrorMessage : Payture.options.TemplateErrors.EmptyCVV,
				Element : "SecureCode"
			}
		}
	},
	/**
	 * Add first digit to value
	 *
	 * @param {String} number
	 * @return {String} two-digits string
	 */
	addValue : function (number) { return number.length == 1 ? "0" + number : number; },
	/**
	 * Select card type - visa or master
	 *
	 * @param {String} cardNumber
	 */
	selectCardType : function (cardNumber) {
		$(".CardType").removeClass("visa master");
		if (cardNumber != "") {
			if (cardNumber.charAt(0) == "4") {
				$(".CardType").addClass("visa");
				if (Array.isArray(Payture.options.Data.CardNumber))
					Payture.options.Data.CardNumber[3].attr("maxlength", 4);
				else
					Payture.options.Data.CardNumber.attr("maxlength", Payture.options.GroupCardNumber ? 19 : 16);
			} else {
				if (cardNumber.charAt(0) == "5" || cardNumber.charAt(0) == "6")
					$(".CardType").addClass("master");
				if (Array.isArray(Payture.options.Data.CardNumber))
					Payture.options.Data.CardNumber[3].attr("maxlength", 7);
				else
					Payture.options.Data.CardNumber.attr("maxlength", Payture.options.GroupCardNumber ? 22 : 19);
			}
		}
	},
	/**
	 * Show errors
	 *
	 * @param {validationResult} error
	 */
	showErrors : function (error) {
		if (error === null)
			return false;
		if (Payture.options.onShowErrors !== null) {
			Payture.options.onShowErrors(error)
		} else if (!error.Success) {
			var element;
			if (Array.isArray(Payture.options.Data[error.Element]))
				element = Payture.options.Data[error.Element][0].parents(".form_row");
			else
				element = Payture.options.Data[error.Element].parents(".form_row");

			if (!Payture.options.IsMobile)
				$(element).find(".error").text(error.ErrorMessage).fadeIn(200);
			else
				$(".error").text(error.ErrorMessage).fadeIn(200);
			$(element).find("input").addClass("wrong");	
		}
	},
	/**
	 * Hide errors
	 *
	 * @param {HTMLElement} element
	 */
	hideErrors : function (element) {
		if (Payture.options.onHideErrors !== null )
			Payture.options.onHideErrors(element)
		else {
			if (Array.isArray(element)) {
				$.each(element, function () {
					$(this).parents(".form_row").find(".error").text("").hide();
					$(this).parents(".form_row").find("input").removeClass("wrong");			
				})
			} else if ($(element).is("input")) {
				$(element).parents(".form_row").find(".error").text("").hide();
				$(element).parents(".form_row").find("input").removeClass("wrong");
			}
		}
	},
	/**
	 * Set button state - disable or enable
	 */
	checkButton : function () {
		var isValid = true;
		$.each(Payture.getFormValues(Payture.options.Data), function (index, value) {
			if (index == "CardId" || index == "AddCard") return true;
			if (!Payture.Validate({ Name : index, Value : value }).Success) isValid = false;
		});
		$("form button").attr("disabled", !isValid);
	},
	/**
	 * Separating card number with space
	 *
	 * @param {Event} event
	 * @param {HTMLInputElement} element
	 */
	separatingNumber : function (event, element) {
		event = (event) ? event : window.event;
		var charCode = (event.which) ? event.which : event.keyCode;
		var pos = Payture.getCaretPosition(element),
			val = element.value.replace(/\s/g, ""),
			length = element.value.length;
		
		if (pos % 5 == 0 && charCode != 8) 
			pos += pos < length ? 1 : 2;
		if (pos > 3 && pos % 5 == 0 && charCode == 8 && pos < 16) 
			pos += -1;

		if (val.length < 16)
			element.value = val.replace(/(\d{4})/gi,"$1 ").trim();
		else
			element.value = val.replace(/(\d{4})(\d{4})(\d{4})(\d{4,})/gi,"$1 $2 $3 $4").trim();

		Payture.setCaretPosition(element, pos);
	},
	/**
	 * Set caret position in input
	 *
	 * @param {HTMLInputElement} element
	 * @param {Number} caretPos - caret position
	 */
	setCaretPosition : function (element, caretPos) {
		if(element != null) {
			if(element.createTextRange) {
				var range = element.createTextRange();
				range.move('character', caretPos);
				range.select();
			} else {
				if (element.selectionStart) {
					element.focus();
					element.setSelectionRange(caretPos, caretPos);
				} else
					element.focus();
			}
		}
	},
	/**
	 * Get caret position in input
	 *
	 * @param {HTMLInputElement} element
	 */
	getCaretPosition : function (element) {
		var CaretPos = 0;
		if (document.selection) {
			element.focus();
			var Sel = document.selection.createRange ();
			Sel.moveStart ('character', -ctrl.value.length);
			CaretPos = Sel.text.length;
		} else if (element.selectionStart || element.selectionStart == '0')
			CaretPos = element.selectionStart;

		return (CaretPos);
	},
	/**
	 * Change focus input
	 *
	 * @param {Event} event
	 * @param {HTMLInputElement} element
	 */
	changeCaretPosition : function (event, element) {
		event = (event) ? event : window.event;
		var charCode = (event.which) ? event.which : event.keyCode,
			name = $(element).attr("name"),
			maxLength = $(element).attr("maxLength"),
			next = $(element).attr("next"),
			prev = $(element).attr("prev"),
			value = $(element).val();
			
		if ((charCode != 9) && (charCode != 37) && (charCode != 39) && (charCode != 16)) {
			if (value.length == maxLength && next)
				$("[name=" + next + "]").focus();

			if (charCode == 8 && value.length == 0 && prev)
				$("[name=" + prev + "]").focus();
		}       
	},
	/**
	 * Resize card number input
	 */
	resizeInput : function () {
		var input = $("input[name='CardNumber3']");
		if (input.length == 0)
			return false;
		input.width(input.val().length > 4 ? "66px" : "57px");
	},
	/**
	 * Checked char - digital or not
	 *
	 * @param {Event} event
	 * @param {String} type - type of regexp
	 * @return {Boolean} result
	 */
	checkChar : function (event, type) {
		if ($.browser.mozilla) return (event.keyCode) ? true : Payture.regexp[type](event.charCode);
		else return Payture.regexp[type](event.keyCode);
	},
	/**
	 * Get latin character by russian character
	 *
	 * @param {String} str - russian or latin character
	 * @return {String} latin character
	 */
	getRuByEn : function (str) { return Payture.enToRu[str] ? Payture.enToRu[str] : str; },
	/**
	 * Transliterate string
	 *
	 * @param {String} str - russian or latin string
	 * @return {String} newStr - latin string
	 */
	changeRuToEn : function (str) {
		var newStr = "";
		$.each(str.split(""), function () { newStr += Payture.getRuByEn(this); });
		return newStr;
	},
	/**
	 * Translit string from russian to latin
	 *
	 * @param {Event} event
	 * @param {HTMLInputElement} element
	 */
	translateText : function (event, element) {
		var charCode = event.charCode ? event.charCode : event.keyCode,
			charCodeStr = String.fromCharCode(charCode),
			ruToEn = Payture.changeRuToEn(charCodeStr.toLowerCase()),
			val = element.value,
			r_simple = /[A-Z ]/i;

		if (charCode == 13)
			return;

		var cursorPos = 0;
		if (document.selection) {
			var range = document.selection.createRange();
			range.moveStart('textedit', -1);
			cursorPos = range.text.length;
		} else
			cursorPos = element.selectionStart;

		if (charCode == 8 || charCode == 9 || charCode == 32 || charCode == 46 || (charCode > 36 && charCode < 41))
			return true;
		else {
			var insertText = "";

			if (r_simple.test(String.fromCharCode(charCode))) {
				insertText = String.fromCharCode(charCode);
				element.value = val.substring(0, cursorPos) + insertText + val.substring(cursorPos, val.length);
				element.selectionStart = cursorPos + 1;
				element.selectionEnd = cursorPos + 1;
			} else if (r_simple.test(ruToEn)) {
				insertText = ruToEn;
				element.value = val.substring(0, cursorPos) + insertText + val.substring(cursorPos, val.length);
				element.selectionStart = cursorPos + 1;
				element.selectionEnd = cursorPos + 1;
			}
		}
		return false;
	},
	/**
	 * Convert XML to String
	 *
	 * @param {XML} xmlData
	 * @return {String} string
	 */
	xmlToString : function (xmlData) { return window.ActiveXObject ? xmlData.xml : (new XMLSerializer()).serializeToString(xmlData); },
	/**
	 * Shows mask stubs instead of inputs
	 *
	 * @param {String} cardMask
	 * @param {Boolean} showCVV
	 */
	showCardStub : function(cardMask, showCVV) {
		if (Array.isArray(Payture.options.Data.CardNumber)) {
			$.each(Payture.options.Data.CardNumber, function (index, value) {
				$(value).val(cardMask.substring(index*4, index*4 + 4)).attr("disabled", true);
			})
		} else if ($(Payture.options.Data.CardNumber).is("input")) {
			var groupMask = cardMask.replace(/((\d|\D){4})/gi,"$1 ").trim();
			$(Payture.options.Data.CardNumber).val(groupMask).attr("disabled", true);
		}
		if ($(Payture.options.Data.EMonth).is("input"))
			$(Payture.options.Data.EMonth).val("XX").attr("disabled", true);
		if ($(Payture.options.Data.EYear).is("input"))
			$(Payture.options.Data.EYear).val("XX").attr("disabled", true);
		if ($(Payture.options.Data.CardHolder).is("input"))
			$(Payture.options.Data.CardHolder).val("CardHolder Name").attr("disabled", true);
		if ($(Payture.options.Data.SecureCode).is("input")){
			if(showCVV == true)
				$(Payture.options.Data.SecureCode).val("");
			else
				$(Payture.options.Data.SecureCode).val("XXX").attr("disabled", true);
		}
	},
	/**
	 * Formatting int
	 * @param {Number} number
	 * @return {String} formatted number
	 */
	formatInt : function (number) {
		if (number == null || number == undefined || number == '')
			return "0.00";

		var str = number.toString();
		str = str.replace(/(\d+)(\d\d)/g, '$1.$2');
		var point = /(\d+)(\.\d{1,2})/g.exec(str) ? /(\d+)(\.\d{1,2})/g.exec(str)[2] : "";
		str = /(\d+)(\.\d{1,2})/g.exec(str) ? /(\d+)(\.\d{1,2})/g.exec(str)[1] : str;
		str = str.replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1&nbsp;');
		return str + point;
	},
	/**
	 * Bind MasterPass scripts
	 */
	MasterPass : function() {
		Payture.GetCardInfo();

		if (window.location.href.indexOf("checkout_resource_url") != -1 && window.location.href.indexOf("oauth_verifier") != -1)
			Payture.setMasterPass();
		else {
			$("form .payBlock").addClass("MPPayBlock");
			$("#masterPass").on("click", function(){
				Payture.RedirectMasterPass();
				return false;
			});
		}
	},
	/**
	 * Get Card info via oauth info from MP redirect link
	 */
	GetCardInfo: function () {
		var oauth_Token = Payture.getURLParam("oauth_token");
		var oauth_Verifier = Payture.getURLParam("oauth_verifier");
		var checkout_Resource_Url = Payture.getURLParam("checkout_resource_url");

		if (oauth_Token != "" && oauth_Verifier != "" && checkout_Resource_Url != "") {
			$.ajax({
				type: "POST",
				url: "/mpapi/GetCardInfo",
				data: {
					"json": "true",
					"oauth_Token": oauth_Token,
					"oauth_Verifier": oauth_Verifier,
					"checkout_Resource_Url": checkout_Resource_Url
				},
				timeout: 30000,
				/**
				 * @ignore
				 * @param {Object} data
				 * @param {String} data.PANMask
				 */
				success: function (data) {
					if (data.PANMask != undefined) {
						Payture.showCardStub(data.PANMask, Payture.options.MasterPassUseCVV);
					}
				},
				error: function () {
					alert("Произошла ошибка");
				}
			});
		}
	},
	/**
	 * Set MasterPass fields after redirect
	 */
	setMasterPass : function () {
		Payture.options.MasterPassRedirected = true;
		var oauth = Payture.getURLParam("oauth_token");
		$("input[name=oauth_Token]").val(oauth);

		Payture.showCardStub("XXXXXXXXXXXXXXXX", Payture.options.MasterPassUseCVV);
		Payture.checkButton();
	},
	/**
	 * Redirecting to MasterPass Interface
	 */
	RedirectMasterPass : function() {
		var Amount = $("input[name='Amount']").val();
		$.ajax({
			type : "POST",
			url : "/mpapi/RedirectMasterPass",
			data : {
				"callbackUrl": window.location.href.replace("&", "[a]"),
				"json": "true",
				"Key": $("input[name='Key']").val(),
				"shopingCart": Amount + ":VashaPokupka|1|" + Amount + ";"
			},
			timeout : 30000,
			/**
			 * @ignore
			 * @param {Object} data
			 * @param {String} data.Url
			 */
			success : function (data) {
				location.href = data.Url;
			},
			error : function () {
				alert("Произошла ошибка");
			}
		});
	},
	/**
	 * Get parameter value from URL string by name
	 *
	 * @param {String} name
	 * @returns {String}l
	 */
	getURLParam : function (name) {
		name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
		var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
			results = regex.exec(location.search);
		return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
	},
	showCheck : function() {
		var sumInKopeks = $('#amount_kopecs').text();
		if(sumInKopeks != ''){
			var currency = $('#amount_currency').text();
			var currencyText = "";
			if(currency == "RUR" || currency == "RUB"){
				currencyText = "руб."
			}
			var sumToShow = Payture.formatInt(sumInKopeks) + " " + currencyText;
			$("#sumFinal").html(sumToShow);

			$("#sendCheckEmail").click(function(){
				Payture.sendCheckEmail();
			})

		} else {
			$('.container.returnCheck').hide();
			$('.container.return').show();
		}
	}
};