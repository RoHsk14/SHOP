const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://lwivyouaiizweukrnrtz.supabase.co';
const supabaseKey = 'sb_publishable_hAUtcON82h3JAr3I_RcoPw_YU-tNZiM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupData() {
  console.log('🚀 Début de la configuration...\n');

  // 1. Vérifier si la table settings existe
  console.log('1️⃣ Vérification de la table settings...');
  const { data: settingsCheck, error: settingsError } = await supabase
    .from('settings')
    .select('*')
    .limit(1);

  if (settingsError && settingsError.message.includes('does not exist')) {
    console.log('❌ La table settings n\'existe pas encore. Veuillez exécuter le SQL complet dans Supabase.');
    return;
  }
  console.log('✅ Table settings OK\n');

  // 2. Supprimer l'ancien produit de test s'il existe
  console.log('2️⃣ Suppression de l\'ancien produit de test...');
  await supabase
    .from('products')
    .delete()
    .eq('name', 'Montre de Luxe Édition Limitée');

  // 3. Ajouter le produit de test
  console.log('3️⃣ Ajout du produit de test...');
  const { data: product, error: productError } = await supabase
    .from('products')
    .insert([{
      name: 'Montre de Luxe Édition Limitée',
      description: 'Découvrez l\'élégance intemporelle avec cette montre de luxe exclusive. Conçue avec précision et style, elle est le compagnon idéal pour toutes les occasions.',
      prices: { EUR: 199.99, XAF: 131000, USD: 216 },
      stock: 50,
      image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1999&auto=format&fit=crop',
      base_price: 199.99,
      currency_code: 'EUR'
    }])
    .select()
    .single();

  if (productError) {
    console.log('❌ Erreur ajout produit:', productError.message);
    return;
  }
  console.log('✅ Produit ajouté:', product.name, '\n');

  // 4. Créer une commande de test
  console.log('4️⃣ Création d\'une commande de test...');
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert([{
      product_id: product.id,
      customer_name: 'Jean Dupont',
      customer_phone: '+33 6 12 34 56 78',
      customer_address: '123 Rue de la République, Paris',
      quantity: 1,
      total_price: 199.99,
      currency: 'EUR',
      status: 'pending'
    }])
    .select()
    .single();

  if (orderError) {
    console.log('❌ Erreur création commande:', orderError.message);
  } else {
    console.log('✅ Commande créée:', order.id, '\n');
  }

  console.log('🎉 Configuration terminée !');
  console.log('👉 Allez sur http://localhost:3000 pour voir le storefront');
  console.log('👉 Allez sur http://localhost:3000/admin pour l\'admin');
}

setupData();
