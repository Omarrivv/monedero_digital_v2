const hre = require("hardhat");

async function main() {
  console.log("🚀 Desplegando MonederoDigital Contract...");

  // Get the ContractFactory and Signers
  const [deployer] = await hre.ethers.getSigners();
  
  console.log("📝 Desplegando con la cuenta:", deployer.address);
  console.log("💰 Balance de la cuenta:", hre.ethers.formatEther(await deployer.provider.getBalance(deployer.address)));

  // Deploy the contract
  const MonederoDigital = await hre.ethers.getContractFactory("MonederoDigital");
  const monederoDigital = await MonederoDigital.deploy();

  await monederoDigital.waitForDeployment();

  const contractAddress = await monederoDigital.getAddress();
  
  console.log("✅ MonederoDigital desplegado en:", contractAddress);
  console.log("🌐 Red:", hre.network.name);
  console.log("⛽ Gas usado en el despliegue:", (await monederoDigital.deploymentTransaction().wait()).gasUsed.toString());

  // Save contract address and ABI
  const contractInfo = {
    address: contractAddress,
    network: hre.network.name,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    abi: MonederoDigital.interface.formatJson()
  };

  const fs = require('fs');
  const path = require('path');
  
  // Create deployments directory if it doesn't exist
  const deploymentsDir = path.join(__dirname, '..', 'deployments');
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }

  // Save deployment info
  fs.writeFileSync(
    path.join(deploymentsDir, `${hre.network.name}.json`),
    JSON.stringify(contractInfo, null, 2)
  );

  console.log("📄 Información del contrato guardada en:", `deployments/${hre.network.name}.json`);

  // Verify contract on Etherscan if not on local network
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("⏳ Esperando 5 bloques para verificación...");
    await monederoDigital.waitForDeployment();
    await new Promise(resolve => setTimeout(resolve, 30000)); // Wait 30 seconds

    try {
      await hre.run("verify:verify", {
        address: contractAddress,
        constructorArguments: [],
      });
      console.log("✅ Contrato verificado en Etherscan");
    } catch (error) {
      console.log("❌ Error verificando contrato:", error.message);
    }
  }

  console.log("🎉 Despliegue completado exitosamente!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error en el despliegue:", error);
    process.exit(1);
  });