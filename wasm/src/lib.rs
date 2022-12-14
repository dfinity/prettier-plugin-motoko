use motoko::lexer::create_token_tree;
use serde::Serialize;
use serde_wasm_bindgen::to_value;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
extern "C" {
    // fn alert(s: &str);
}

fn js_return<T: Serialize + ?Sized>(value: &T) -> Result<JsValue, JsError> {
    to_value(value).map_err(|e| JsError::new(&format!("Serialization error ({})", e)))
}

#[wasm_bindgen(start)]
pub fn start() {
    #[cfg(feature = "console_error_panic_hook")]
    console_error_panic_hook::set_once();
}

#[wasm_bindgen]
pub fn parse_token_tree(input: &str) -> Result<JsValue, JsError> {
    let tt = create_token_tree(input).map_err(|_| JsError::new("Unable to parse input string"))?;

    js_return(&tt)
}

#[wasm_bindgen]
pub fn is_keyword(ident: &str) -> Result<JsValue, JsError> {
    js_return(&motoko::lexer::is_keyword(ident))
}
