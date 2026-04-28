const { ethers } = require("ethers");
const fs   = require("fs");
const path = require("path");

let provider;
let adminSigner;
const contracts = {};

function loadABI(name) {
  const p = path.join(__dirname, "../contracts/abis", `${name}.json`);
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function loadAddresses() {
  const p = path.join(__dirname, "../contracts/addresses.json");
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

async function initContracts() {
  const rpc = process.env.RPC_URL || "http://127.0.0.1:8545";
  provider  = new ethers.JsonRpcProvider(rpc);

  const network = await provider.getNetwork();
  console.log(`  Chain: ${network.name} (${network.chainId})`);

  const pk = process.env.ADMIN_PRIVATE_KEY;
  adminSigner = pk ? new ethers.Wallet(pk, provider) : (await provider.getSigner());

  const addresses = loadAddresses();
  const names = ["StudentManagement", "AssignmentManager", "GradeManager", "AttendanceTracker", "FeeManager"];
  for (const name of names) {
    const abi = loadABI(name);
    contracts[name] = new ethers.Contract(addresses[name], abi, adminSigner);
  }
  return contracts;
}

function getContract(name) {
  if (!contracts[name]) throw new Error(`Contract '${name}' not initialised. Run initContracts() first.`);
  return contracts[name];
}

function contractWithSigner(name, privateKey) {
  const signer = new ethers.Wallet(privateKey, provider);
  return contracts[name].connect(signer);
}

function getProvider()     { return provider; }
function getAdminSigner()  { return adminSigner; }

const ROLES = {
  ADMIN_ROLE:   ethers.keccak256(ethers.toUtf8Bytes("ADMIN_ROLE")),
  TEACHER_ROLE: ethers.keccak256(ethers.toUtf8Bytes("TEACHER_ROLE")),
  STUDENT_ROLE: ethers.keccak256(ethers.toUtf8Bytes("STUDENT_ROLE")),
  PARENT_ROLE:  ethers.keccak256(ethers.toUtf8Bytes("PARENT_ROLE")),
};

const ROLE_NAMES = Object.fromEntries(
  Object.entries(ROLES).map(([k, v]) => [v, k.replace("_ROLE", "").toLowerCase()])
);

function roleToString(bytes32) {
  return ROLE_NAMES[bytes32] || "unknown";
}

function stringToRole(str) {
  const key = str.toUpperCase() + "_ROLE";
  return ROLES[key] || null;
}

module.exports = {
  initContracts,
  getContract,
  contractWithSigner,
  getProvider,
  getAdminSigner,
  ROLES,
  roleToString,
  stringToRole,
};
