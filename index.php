<!DOCTYPE html>
<html lang="fr">
<head>
    <meta name="robots" content="noindex">
    <meta charset="UTF-8">
    <title>Portfolio Lukas</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css"/>
    <link rel="stylesheet" href="assets/css/styleindex.css">
</head>
<body>
    <div class="portfolio">
        <?php
            // Tableau contenant les informations de chaque projet
            $projects = [
                [
                    "title" => "Ludoie",
                    "description" => "Jeu vidéo combinant le jeu de l'oie et les petits chevaux!",
                    "image" => "assets\images\Ludoie\LudoieIcon.png",
                    "link"  => "ludoie.php"
                ],
                [
                    "title" => "IQ Expander Restored",
                    "description" => "Un ancien jeu vidéo de puzzle point-and-click restauré pour les ordinateurs modernes.",
                    "image" => "assets\images\IqExpander\RestoredIcon.png",
                    "link"  => "iqexpander.php"
                ]
            ];

            foreach($projects as $project) {
                echo '<a class="project-link" href="'.$project['link'].'">';
                echo '<div class="project animate__animated animate__fadeInUp">';
                echo '<img src="'.$project['image'].'" alt="'.$project['title'].'">';
                echo '<h2>'.$project['title'].'</h2>';
                echo '<p>'.$project['description'].'</p>';
                echo '</div>';
                echo '</a>';
            }
        ?>
    </div>
</body>
</html>
