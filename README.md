**Connect Four**
*by Stephan Glaue, Julian Trösser, Lusian Fischer, Elias Cordoso Alves*

 - **Anleitung**:
	 - Mit der Website verbinden
	 - Einen Benutzernamen eingeben, [Enter] drücken
	 - Kein Name wird nicht akzeptiert, ein doppelter Name wird durch einen zufälligen Namen ersetzt
	 - Es erscheinen Spielfeld und Chat
	 - Sobald zwei Spieler an diesem Punkt angelangt sind, können Chat und Spiel verwendet werden
	 - Wer auch immer zuerst das Spielfeld anklickt, beginnt
	 - Die Plättchen verhalten sich wie Plättchen in einem realen Vier Gewinnt, d.h. sie "fallen zu Boden"
	 - Weitere Clients können sich mit dem Spiel verbinden, sie sind Zuschauer und können keinen Einfluss auf das Spiel nehmen
	 - Verlässt einer der Spieler das Spiel, gewinnt der andere Spieler
	 - Gelingt es einem Spieler, vier Plättchen horizontal, vertikal oder diagonal in einer Reihe zu legen, so gewinnt er und der Endbildschirm zeigt den Sieger an
	 - Laden die Spieler dann die Website neu, so gelangen sie wieder zur Eingabe des Benutzernamens
	 - Die ersten zwei Spieler, die ihren Namen mit [Enter] bestätigen, können wieder spielen
 - **Informationen**:
	 - Die Website wird über die Cloud-Platform "Heroku" (PaaS) gehostet, da unser kein physischer Server zur Verfügung stand
	 - Das Spiel ist erreichbar unter [https://qconnectfour.herokuapp.com/](https://qconnectfour.herokuapp.com/ "https://qconnectfour.herokuapp.com/")
	 - Für die Serverkommunikation wurde die [Socket.io](https://socket.io) Library verwendet
	 - Grundlage für unseren Lernprozess und den Code ist ein Codebeispiel von der Socket.io Website gewesen
	 - Für das Spiel wurde die bereits existierende [ "connect-four"](https://github.com/bryanbraun/connect-four) Library verwendet. Weitere Funktionen wurden ergänzt
	 - Die Seite ist nicht mit dem Internet Explorer kompatibel
	 - Bei Firefox ist eine Scrollbar seitlich leider noch sichtbar, dies lässt sich aufgrund der Machart des Browsers nicht ändern
