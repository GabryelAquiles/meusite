let anotacoes = JSON.parse(localStorage.getItem('aquiles_notas')) || [];

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition;

if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.continuous = false;
    recognition.interimResults = false;
} else {
    alert("Seu navegador não suporta reconhecimento de voz. Use o Chrome ou Edge.");
}

function falar(texto) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel(); 
        const utterance = new SpeechSynthesisUtterance(texto);
        utterance.lang = 'pt-BR';
        utterance.rate = 1.1; 
        window.speechSynthesis.speak(utterance);
    }
}

const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const chatContainer = document.getElementById('chatContainer');
const aquilesRing = document.getElementById('aquilesRing');
const statusText = document.getElementById('statusText');

function processarComandoLocal(input) {
    const frase = input.toLowerCase().trim();

    const termosMusica = ['tocar', 'toque', 'toca a música', 'toca', 'bota pra tocar', 'coloque a música', 'spotify'];
    const comandoMusicaEncontrado = termosMusica.find(termo => frase.startsWith(termo) || frase.includes(termo));

    if (comandoMusicaEncontrado) {
        let termoBusca = frase;
        termosMusica.forEach(termo => {
            termoBusca = termoBusca.replace(termo, '');
        });
        termoBusca = termoBusca.replace('no spotify', '').replace('a música', '').trim();
        
        if (!termoBusca) {
            window.open('https://open.spotify.com', '_blank');
            return "Abrindo o Spotify para você.";
        } else {
            window.open(`https://open.spotify.com/search/${encodeURIComponent(termoBusca)}`, '_blank');
            return `Buscando e tocando ${termoBusca} no Spotify.`;
        }
    }

    const termosSite = ['abra o site', 'abra o', 'abrir', 'abre o', 'entra no site', 'entra no', 'entrar no'];
    const comandoSiteEncontrado = termosSite.find(termo => frase.startsWith(termo));

    if (comandoSiteEncontrado) {
        let site = frase;
        termosSite.forEach(termo => {
            site = site.replace(termo, '');
        });
        site = site.trim();
        
        if (site) {
            if (!site.includes('.')) site += '.com';
            const urlCompleta = site.startsWith('http') ? site : `https://${site}`;
            window.open(urlCompleta, '_blank');
            return `Abrindo o site ${site} para você.`;
        }
    }

    if (frase.includes('horas') || frase.includes('hora') || frase.includes('relógio')) {
        const agora = new Date();
        const hora = agora.getHours();
        const minutos = String(agora.getMinutes()).padStart(2, '0');
        return `Agora são exatamente ${hora} horas e ${minutos} minutos.`;
    }
    
    if (frase.includes('data') || frase.includes('dia é hoje') || frase.includes('calendário') || frase.includes('que dia é')) {
        const agora = new Date();
        const opcoes = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        return `Hoje é ${agora.toLocaleDateString('pt-BR', opcoes)}.`;
    }

    const termosAnotar = ['anote ', 'anotar ', 'guarda aí ', 'cria uma nota ', 'salva aí '];
    const comandoAnotarEncontrado = termosAnotar.find(termo => frase.startsWith(termo));

    if (comandoAnotarEncontrado) {
        let nota = input.substring(comandoAnotarEncontrado.length).trim(); 
        if (nota) {
            anotacoes.push(nota);
            localStorage.setItem('aquiles_notas', JSON.stringify(anotacoes));
            return `Anotado com sucesso: "${nota}".`;
        }
    }

    if (frase.includes('ver anotações') || frase.includes('listar notas') || frase.includes('o que eu tenho anotado') || frase.includes('mostrar notas') || frase.includes('minhas anotações')) {
        if (anotacoes.length === 0) {
            return "Você não possui nenhuma anotação salva até o momento.";
        }
        return `Suas anotações são: ${anotacoes.map((n, i) => `[${i + 1}] ${n}`).join(', ')}.`;
    }

    if (frase.includes('limpar anotações') || frase.includes('apagar notas') || frase.includes('deletar notas') || frase.includes('limpar tudo')) {
        anotacoes = [];
        localStorage.removeItem('aquiles_notas');
        return "Todas as suas anotações foram apagadas com sucesso.";
    }

    let expressaoLimpa = frase.replace('quanto é', '').replace('calcule', '').replace('resultado de', '')
                               .replace(/x/g, '*').replace(/÷/g, '/').replace(/,/g, '.').trim();

    const ehCalculoMatematico = /^[\d\s+\-*/().]+$/.test(expressaoLimpa);

    if (ehCalculoMatematico && expressaoLimpa.length > 0) {
        try {
            let resultado = new Function(`return ${expressaoLimpa}`)();
            if (isNaN(resultado) || !isFinite(resultado)) throw new Error();
            return `O resultado do cálculo é ${String(resultado).replace('.', ',')}.`;
        } catch (e) {
        }
    }

    if (frase.includes('olá') || frase.includes('oi') || frase.includes('bom dia') || frase.includes('boa tarde') || frase.includes('eae') || frase.includes('salve')) {
        return "Olá! Sou o Aquiles. Estou pronto para gerenciar suas tarefas, calcular, abrir sites, tocar músicas ou informar a hora.";
    }
    
    if (frase.includes('quem é você') || frase.includes('seu nome') || frase.includes('o que você é')) {
        return "Eu sou o Aquiles, seu assistente virtual construído em JavaScript estruturado.";
    }

    if (frase.includes('ajuda') || frase.includes('comandos') || frase.includes('o que você faz')) {
        return "Você pode me comandar de várias formas, exemplos: 'Toque ela é amiga da minha mulher', 'Abre o site youtube.com', '10 x 5', 'Anote comprar café', ou 'Que horas são?'.";
    }

    return "Comando não reconhecido. Diga 'ajuda' para verificar a lista de funções disponíveis.";
}

function processCommand(text) {
    if (!text.trim()) return;

    addMessage(text, 'user');
    userInput.value = '';

    aquilesRing.classList.add('thinking');
    statusText.innerText = "Aquiles executando...";

    setTimeout(() => {
        const resposta = processarComandoLocal(text);
        
        aquilesRing.classList.remove('thinking');
        aquilesRing.style.borderColor = "#38bdf8"; 
        statusText.innerText = "Aguardando comando...";
        
        addMessage(resposta, 'system');
        falar(resposta);
    }, 400); 
}

function addMessage(text, sender) {
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message', sender);
    msgDiv.innerText = text;
    chatContainer.appendChild(msgDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

aquilesRing.style.cursor = "pointer";
aquilesRing.addEventListener('click', () => {
    if (!recognition) return;
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    
    recognition.start();
    statusText.innerText = "Ouvindo... Fale agora!";
    aquilesRing.style.borderColor = "#dea71d"; 
});

if (recognition) {
    recognition.onresult = (event) => {
        const comandoVoz = event.results[0][0].transcript;
        processCommand(comandoVoz);
    };

    recognition.onerror = () => {
        statusText.innerText = "Não entendi o comando de voz.";
        aquilesRing.style.borderColor = "#38bdf8";
    };
}

sendBtn.addEventListener('click', () => processCommand(userInput.value));
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') processCommand(userInput.value);
});