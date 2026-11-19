const conectarArduino = document.getElementById("conectarArduino");
const valorIluminancia = document.getElementById("iluminancia");
const resistorAtual = document.getElementById("resistor");
const estado = document.getElementById("estado");
let porta;


conectarArduino.addEventListener("click", conexaoSerial);

async function conexaoSerial(){
    if (!("serial" in navigator)){
        estado.textContent = "Este navegador não aceita conexões serial. Dica: utilize o Google Chrome ou o Microsoft Edge.";
        return;
    }

    try{
        estado.textContent = "Aguardando autorização..."

        porta = await navigator.serial.requestPort();
        await porta.open({
            baudRate: 9600
        });
        const leitor = porta.readable.getReader();

        estado.textContent = "Conectado. Aguardando valores de iluminância...";

        let texto = "";

        while (true){
            const {value, done} = await leitor.read();
            
            if (done){
                break;
            }
    
            texto += new TextDecoder().decode(value);
            const linhas = texto.split("\n");
            texto = linhas.pop();
    
            for (let linha of linhas){
                linha = linha.trim();
                if (linha === "") { continue; }
    
                const mediaIluminancia = Number(linha.split(",")[2]);
                const resistorAuxiliar = linha.split(",")[1];
                const iluminancia = Number(linha.split(",")[0]);
    
                if (linha.split(",").length !== 3 || !Number.isFinite(iluminancia)){
                    console.warn("Leitura inválida: ", linha);
                    continue;
                }

                resistorAtual.textContent = resistorAuxiliar;
                valorIluminancia.textContent = iluminancia.toFixed(2);
                estado.textContent = "Conectado.";
            }
        }
    
        leitor.releaseLock(); 
        
    }

    catch (erro){
        estado.textContent = "Erro na conexão: " + erro.message;
        console.error(erro);
    }

}