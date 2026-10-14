const SUPABASE_URL = "https://vmzsdntmfdqmuilcsotj.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_jbFJoPbxXAs5SzPiOfTsew_s5PAL2yd";

window.supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);

async function testSupabaseConnection() {
    const { data, error } = await window.supabaseClient
        .from("vehicle_locations")
        .select("*")
        .order("id");

    if (error) {
        console.error("Supabase connection error:", error.message);
        return;
    }

    console.log("Supabase connected!", data);
}

testSupabaseConnection();

window.supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);

console.log("Supabase client created:", !!window.supabaseClient);

console.log("SUPABASE.JS LOADED");
console.log("CLIENT:", window.supabaseClient);
