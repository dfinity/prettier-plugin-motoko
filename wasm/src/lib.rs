use motoko::lexer::create_token_tree;
use wasm_bindgen::prelude::*;

// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
// allocator.
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[wasm_bindgen]
extern "C" {
    // fn alert(s: &str);
}

#[wasm_bindgen(start)]
pub fn start() {
    #[cfg(feature = "console_error_panic_hook")]
    console_error_panic_hook::set_once();
}

#[wasm_bindgen]
pub fn parse_token_tree(input: &str) -> Result<JsValue, JsError> {
    let tt = create_token_tree(input).map_err(|_| JsError::new("Unable to parse input string"))?;

    JsValue::from_serde(&tt)
        .map_err(|e| JsError::new(&format!("Serialization error ({:?})", e.classify())))
}
