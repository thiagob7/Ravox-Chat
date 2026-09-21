# Animações

| arquivo | autor | origem | licença |
|---|---|---|---|
| `calendar.json` | Hrant Atoyan | [LottieFiles](https://lottiefiles.com/free-animation/calendar-SbhojNOLVl) | [Lottie Simple License](https://lottiefiles.com/page/license) |
| `marking-a-calendar.json` | motionilly | [LottieFiles](https://lottiefiles.com/free-animation/marking-a-calendar-PwMkKpwI0V) | [Lottie Simple License](https://lottiefiles.com/page/license) |
| `trophy.json` | — | [LottieFiles](https://lottiefiles.com/animations/qa1trophy-AvTG7hntLJ) | [Lottie Simple License](https://lottiefiles.com/page/license) |
| `add-friend.json` | — | [LottieFiles](https://lottiefiles.com/animations/emptylist-friends-M8hYgCFJjX) | [Lottie Simple License](https://lottiefiles.com/page/license) |
| `speech-bubbles.json` | — | [LottieFiles](https://lottiefiles.com/animations/comments-ujYUv7EpCN) | [Lottie Simple License](https://lottiefiles.com/page/license) |
| `cat-crying.json` | Abdul Latif | [LottieFiles](https://lottiefiles.com/free-animation/cat-crying-emojisticker-animation-xvvswYf0RW) | [Lottie Simple License](https://lottiefiles.com/page/license) |
| `not-found.json` | Ahmet Tamtürk | [LottieFiles](https://lottiefiles.com/free-animation/404-error-eE8SmxEpYp) | [Lottie Simple License](https://lottiefiles.com/page/license) |
| `loading.json` | vinay kurve | [LottieFiles](https://lottiefiles.com/free-animation/loading-sp5ya2LLZC) | [Lottie Simple License](https://lottiefiles.com/page/license) |
| `loader-success.json` | Imran Khan | [LottieFiles](https://lottiefiles.com/free-animation/loader-and-success-ErL7PDpcXz) | [Lottie Simple License](https://lottiefiles.com/page/license) |
| `thank-you.json` | Yusuf Adekunbi | [LottieFiles](https://lottiefiles.com/free-animation/thank-you-fS3GotkvX1) | [Lottie Simple License](https://lottiefiles.com/page/license) |
| `../lottie/infinity-hero.json` | Abdul Latif | [LottieFiles](https://lottiefiles.com/free-animation/cute-astronaut-super-hero-flying-ClDlABy0Hn) | [Lottie Simple License](https://lottiefiles.com/page/license) |
| `../lottie/infinity.json` | nosso | — | — |

A Lottie Simple License libera uso comercial e não exige crédito. Exige que
qualquer versão modificada seja distribuída sob os mesmos termos. O crédito aqui
é cortesia, e serve para sabermos de onde cada arquivo veio.

`calendar.json` é vetor puro, 30 KB, e pode ser recolorido.

`marking-a-calendar.json` tem PNGs embutidos e não pode ser recolorido. Está
como veio do autor, com o borrão azul-claro que faz o fundo do desenho.

`cat-crying.json` veio com 795 KB. Aqui está com 622 KB: as chaves de nome
(`nm`, `mn`), os índices de expressão (`ix`, `cix`) e os padrões redundantes
(`bm: 0`, `hd: false`) saíram, e os números foram arredondados para duas casas.
São 500 unidades de lado desenhadas em 112 px, então a segunda casa já é bem
menor que um pixel. A contagem de objetos e de keyframes é a mesma do original.

O peso vem de seis camadas de um segundo cada, com o gato inteiro remodelado
quadro a quadro. Não há como deduplicar: as seis são desenhos diferentes.

`thank-you.json` e `infinity-hero.json` passaram pelo mesmo enxugamento do
`cat-crying.json`, e a contagem de objetos e de keyframes continua igual à do
original: 132 → 69 KB e 905 → 587 KB.

`not-found.json` é o 404 do astronauta, e trocou o gato de antes. São sete
camadas de imagem (três estrelas, os dois "4", o planeta com o astronauta e a
lua), não vetor. Como cada "4" é uma imagem só dele, os dois foram recoloridos
pixel a pixel: o rosa `#ff66bb` virou o indigo `#5c5ff0` da marca girando o
matiz e reescalando saturação e claridade na mesma proporção, o que preserva
todo o sombreado do desenho. Pixel quase sem cor (saturação abaixo de 0,02)
ficou como estava, para não tingir a sombra cinza.

As sete imagens também desceram de 3230 para 1292 px de largura — a tela
desenha em 576 px, então ainda sobra o dobro para retina — e as cinco que
aguentam paleta de 256 cores foram gravadas assim. Com o enxugamento por cima,
o arquivo foi de 967 para 302 KB, com a mesma contagem de objetos e de
keyframes do original. Os campos `w`/`h` do `assets` continuam nos 3230×1959
de origem, que é o que dá a escala ao desenho.

O `loading.json` tinha a palavra "LOADING" desenhada embaixo da mão, em inglês.
A camada saiu; quem diz o que está acontecendo é o nosso texto, traduzido.

O `thank-you.json` veio com a frase "Your account has been successfully
registered" desenhada dentro da animação, em inglês. As duas camadas de texto
foram removidas — por isso ele tem menos objetos que o original. O que aparece
na tela é o visto e o confete; a frase é nossa, traduzida, escrita embaixo.

## Cursores

| pasta | autor | origem | licença |
|---|---|---|---|
| `assets/cursores/` | Kenney | [Cursor Pack](https://kenney.nl/assets/cursor-pack) | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) |

CC0 é domínio público: uso comercial, modificação e redistribuição liberados,
sem crédito obrigatório. O crédito aqui é cortesia, igual ao das animações.

São 48 arquivos, oito conjuntos de seis papéis, tirados de
`PNG/Outline/Double` e `PNG/Basic/Double` do pacote original. Vêm em 64 px porque é o tamanho que
serve às telas retina; o navegador reduz para 32 sozinho.
