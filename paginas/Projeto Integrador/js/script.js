const conectarArduino = document.getElementById("conectarArduino");
const valorIluminancia = document.getElementById("iluminancia");
const resistorAtual = document.getElementById("resistor");
const estado = document.getElementById("estado");
const mediaLDR = document.getElementById("mediaLDR");
const calibrar = document.getElementById("calibrar");
const slider  = document.getElementById("slider");
const valorMin = document.getElementById("valorMinimo");
const valorMax = document.getElementById("valorMaximo");
const valorCalibrado = document.getElementById("valorCalibrado");
let porta;
let valorMinimo = 0.0;
let valorMaximo = 0.0;
let valorCalibragem;
let mediaIluminancia;
let valorAnomalo = false;

//integração com o Arduino

conectarArduino.addEventListener("click", conexaoSerial);

async function conexaoSerial(){
    if (!("serial" in navigator)){
        estado.textContent = "Este navegador não aceita conexões serial. Dica: utilize o Google Chrome ou o Microsoft Edge.";
        return;
    }

    let leitor;

    try{
        estado.textContent = "Aguardando autorização..."

        porta = await navigator.serial.requestPort();
        await porta.open({
            baudRate: 9600
        });
        leitor = porta.readable.getReader();

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
    
                mediaIluminancia = Number(linha.split(",")[2]);
                const resistorAuxiliar = linha.split(",")[1];
                const iluminancia = Number(linha.split(",")[0]);
    
                if (linha.split(",").length !== 3 || !Number.isFinite(iluminancia)){
                    console.warn("Leitura inválida: ", linha);
                    continue;
                }

                resistorAtual.textContent = resistorAuxiliar;
                valorIluminancia.textContent = iluminancia.toFixed(2);
                mediaLDR.textContent = mediaIluminancia.toFixed(2) > 0.0? 
                    mediaIluminancia.toFixed(2) : 
                    "Calculando média, aguarde...";
                estado.textContent = "Conectado.";
                if (mediaIluminancia !== 0.0) { calibrar.disabled = false; }

                if (!slider.disabled && Math.abs(slider.value - mediaIluminancia.toFixed(2)) > 5.0){ 
                    slider.value = mediaIluminancia.toFixed(2); 
                    //tentar animacao slider
                }

                //valores anomalos

                if (valorMaximo !== 0 && valorMinimo !== 0){
                    if (iluminancia >  valorMaximo && iluminancia > 1000){
                        slider.value = valorMaximo;

                        if (!valorAnomalo){
                            //PROGRAMACAO FLASHBANG
                            valorAnomalo = true;
                        }
                    }
                    else if (iluminancia < valorMinimo && iluminancia < 10){
                        slider.value = valorMinimo;

                        if (!valorAnomalo){
                            //PROGRAMACAO UNDERWATER 
                            valorAnomalo = true;
                        }
                    }
                }

                if (valorAnomalo && iluminancia < valorMaximo && iluminancia > 0.0){ valorAnomalo = false; }
          
            }
        }
        
    }

    catch (erro){
        estado.textContent = "Erro na conexão: " + erro.message;
        console.error(erro);
    }
    finally{
        if(leitor){ leitor.releaseLock(); }
        slider.disabled = true;
        calibrar.disabled = true;
    }

}

//calibragem e slider

calibrar.addEventListener("click", () => {
    valorCalibragem = mediaIluminancia.toFixed(2);
    valorMinimo = 0.25*mediaIluminancia;
    valorMaximo = 1.25*mediaIluminancia;

    slider.disabled = false;
    slider.min = valorMinimo;
    slider.max = valorMaximo;

    valorMin.textContent = valorMinimo.toFixed(2);
    valorMax.textContent = valorMaximo.toFixed(2);
    valorCalibrado.textContent = mediaIluminancia.toFixed(2);
    
    slider.value = mediaIluminancia.toFixed(2);
});



