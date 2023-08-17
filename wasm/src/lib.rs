use motoko::lexer::{create_token_tree, find_comment_spans};
use serde::Serialize;
use serde_wasm_bindgen::to_value;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
extern "C" {
    // fn alert(s: &str);
}

type JsResult = Result<JsValue, JsError>;

fn js_return<T: Serialize + ?Sized>(value: &T) -> JsResult {
    to_value(value).map_err(|e| JsError::new(&format!("Serialization error ({})", e)))
}

#[wasm_bindgen(start)]
pub fn start() {
    #[cfg(feature = "console_error_panic_hook")]
    console_error_panic_hook::set_once();
}

#[wasm_bindgen]
pub fn find_comments(input: &str) -> JsResult {
    js_return(
        &find_comment_spans(input)
            .into_iter()
            .map(|r| (r.start, r.end))
            .collect::<Vec<_>>(),
    )
}

#[wasm_bindgen]
pub fn parse_token_tree(input: &str) -> JsResult {
    js_return(&create_token_tree(input).map_err(|_| JsError::new("Unable to parse input string"))?)
}

#[wasm_bindgen]
pub fn is_keyword(ident: &str) -> JsResult {
    js_return(&motoko::lexer::is_keyword(ident))
}
