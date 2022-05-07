/* tslint:disable */
/**
 * This file was automatically generated by json-schema-to-typescript.
 * DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema file,
 * and run json-schema-to-typescript to regenerate this file.
 */

export interface CompiledServiceConfig {
  commands: "build" | "bundle" | "deploy" | "dev" | "generate" | "prerender" | "rdev" | "release" | "server" | "start";
  endpoints:
    | "AllProducts"
    | "CurrentUser"
    | "GetCoupon"
    | "GetCustomerData"
    | "GetInvoices"
    | "GetProduct"
    | "ListSubscriptions"
    | "Login"
    | "ManageCustomer"
    | "ManagePaymentMethod"
    | "ManageSubscription"
    | "ManageUser"
    | "NewVerificationCode"
    | "ResetPassword"
    | "SendOneTimeCode"
    | "SetPassword"
    | "StartNewUser"
    | "UpdateCurrentUser"
    | "UserGoogleAuth"
    | "VerifyAccountEmail"
    | "stripeWebhooks";
  routes:
    | "blog"
    | "blogIndex"
    | "blogSingle"
    | "docs"
    | "docsIndex"
    | "docsSingle"
    | "home"
    | "install"
    | "plugins"
    | "showcase"
    | "showcaseSingle"
    | "testing";
  ui:
    | "ElAvatar"
    | "ElButton"
    | "ElForm"
    | "ElInput"
    | "ElModal"
    | "ElSpinner"
    | "InputCheckbox"
    | "InputCheckboxMulti"
    | "InputDomain"
    | "InputEmail"
    | "InputNumber"
    | "InputOneTimeCode"
    | "InputPassword"
    | "InputPhone"
    | "InputPrice"
    | "InputRadio"
    | "InputRadioButton"
    | "InputSelect"
    | "InputSelectCustom"
    | "InputSelectMulti"
    | "InputSubmit"
    | "InputText"
    | "InputTextarea"
    | "InputTimezone"
    | "InputToggle"
    | "InputUrl"
    | "InputWeight";
  menus: "";
  [k: string]: unknown;
}
