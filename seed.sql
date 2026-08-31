-- Kalaivani Stores: products table + seed (52 products)
drop table if exists products;

create table products (
  id bigint generated always as identity primary key,
  name text not null,
  emoji text,
  category text not null,
  price numeric not null,
  unit text,
  image_url text,
  group_key text,
  in_stock boolean not null default true,
  featured boolean not null default false,
  sort_order bigint not null default 0
);

alter table products enable row level security;

create policy "Public read products"
  on products for select
  to anon
  using (true);

insert into products (name, emoji, category, price, unit, group_key, in_stock, featured, sort_order) values
('GoodDay Biscuit','🍪','Snacks',5,'per pack','GoodDay Biscuit',true,false,0),
('GoodDay Biscuit','🍪','Snacks',10,'per pack','GoodDay Biscuit',true,false,1),
('GoodDay Biscuit','🍪','Snacks',20,'per pack','GoodDay Biscuit',true,false,2),
('GoodDay Biscuit','🍪','Snacks',50,'per pack','GoodDay Biscuit',true,false,3),
('GoodDay Biscuit chocolate','🍪','Snacks',10,'per pack','GoodDay Biscuit chocolate',true,false,4),
('Britannia Bourbon','🍪','Snacks',10,'per pack','Britannia Bourbon',true,false,5),
('Britannia Bourbon','🍪','Snacks',20,'per pack','Britannia Bourbon',true,false,6),
('Marie Gold','🍪','Snacks',10,'per pack','Marie Gold',true,false,7),
('Marie Gold','🍪','Snacks',30,'per pack','Marie Gold',true,false,8),
('Parle-G Biscuit','🍘','Snacks',5,'per pack','Parle-G Biscuit',true,false,9),
('Parle-G Biscuit','🍘','Snacks',10,'per pack','Parle-G Biscuit',true,false,10),
('Sunfeast Biscuit','🍘','Snacks',5,'per pack',null,true,false,11),
('Lay''s Chips','🥔','Snacks',20,'per pack',null,true,false,12),
('Bourbon Biscuit','🍫','Snacks',20,'per pack',null,true,false,13),
('Murukku','🌀','Snacks',30,'per pack',null,true,false,14),
('Mixture','🥜','Snacks',20,'per pack',null,true,false,15),
('Pepsi – 500ml','🥤','Beverages',40,'bottle',null,true,false,16),
('Frooti – 200ml','🧃','Beverages',15,'pack',null,true,false,17),
('Sprite – 500ml','🍾','Beverages',40,'bottle',null,true,false,18),
('Energy Drink','⚡','Beverages',80,'can',null,true,false,19),
('Buttermilk','🫙','Beverages',20,'pack',null,true,false,20),
('Water Bottle – 1L','💧','Beverages',20,'bottle',null,true,false,21),
('Milk – 500ml','🥛','Dairy',27,'packet',null,true,false,22),
('Curd – 200g','🍶','Dairy',25,'cup',null,true,false,23),
('Butter – 100g','🧈','Dairy',55,'pack',null,true,false,24),
('Paneer – 200g','🫙','Dairy',90,'pack',null,true,false,25),
('Rice – 1 kg','🍚','Groceries',70,'per kg',null,true,false,26),
('Toor Dal – 500g','🫘','Groceries',65,'pack',null,true,false,27),
('Sugar – 1 kg','🍬','Groceries',45,'per kg',null,true,false,28),
('Cooking Oil – 1L','🫙','Groceries',140,'bottle',null,true,false,29),
('Salt – 1 kg','🧂','Groceries',20,'pack',null,true,false,30),
('Atta – 1 kg','🌾','Groceries',55,'pack',null,true,false,31),
('Tomato – 500g','🍅','Groceries',30,'500g',null,true,false,32),
('Onion – 1 kg','🧅','Groceries',40,'per kg',null,true,false,33),
('Potato – 1 kg','🥔','Groceries',35,'per kg',null,true,false,34),
('Maggi Noodles','🍜','Quick meals',15,'per pack',null,true,false,35),
('Yippee Noodles','🍜','Quick meals',15,'per pack',null,true,false,36),
('Cup Noodles','🍵','Quick meals',30,'per cup',null,true,false,37),
('MTR Upma Mix','🫕','Quick meals',45,'per pack',null,true,false,38),
('Poha – 500g','🍚','Quick meals',35,'per pack',null,true,false,39),
('Bath Soap','🧼','Bath & Body',40,'per bar',null,true,false,40),
('Shampoo Sachet','🧴','Bath & Body',5,'per sachet',null,true,false,41),
('Toothpaste – 100g','🦷','Bath & Body',50,'tube',null,true,false,42),
('Toothbrush','🪥','Bath & Body',30,'each',null,true,false,43),
('Sanitary Pads','🩸','Bath & Body',55,'per pack',null,true,false,44),
('Washing Powder','🧺','Home Cleaning',60,'per pack',null,true,false,45),
('Dish Soap','🫧','Home Cleaning',35,'per bar',null,true,false,46),
('Phenyl – 500ml','🧽','Home Cleaning',60,'bottle',null,true,false,47),
('Notebook – 200 pages','📓','Stationery',60,'each',null,true,false,48),
('Pen (Blue)','🖊️','Stationery',10,'each',null,true,false,49),
('Pencil Set','✏️','Stationery',20,'per pack',null,true,false,50),
('Stapler','📌','Stationery',80,'each',null,true,false,51)
;
