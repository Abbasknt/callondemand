import { getBillersByCategory } from "./src/actions/monnify";
async function run() {
  const res = await getBillersByCategory("DATA_BUNDLE");
  if (res && "response" in res) {
    console.log(JSON.stringify(res.response?.map((b:any) => ({name: b.name, code: b.billerCode}))));
  }
}
run();
